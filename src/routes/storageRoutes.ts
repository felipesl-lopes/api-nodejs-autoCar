import { addDoc, collection, doc, updateDoc } from "@firebase/firestore";
import express, { Request, Response } from "express";
import {
  deleteObject,
  getDownloadURL,
  getMetadata,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { firestore, storage } from "../config/firebaseConfig";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/uploadBytes", upload.single("image"), async (req, res) => {
  try {
    const { currentUid, uidImage } = await req.body;
    const image = req.file;

    if (!image) {
      res.status(400).send({ error: "Arquivo não enviado." });
      return;
    }

    const uploadRef = ref(storage, `images/${currentUid}/${uidImage}`);
    const upload = await uploadBytes(uploadRef, image?.buffer);
    const download = await getDownloadURL(upload.ref);

    res.status(200).send(download);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete("/deleteImage", async (req, res) => {
  try {
    const { imagePath } = req.query;
    if (!imagePath || typeof imagePath !== "string") {
      res.status(400).send({ message: "Caminho inválido ou ausente." });
    }

    const imageRef = ref(storage, imagePath as string);
    await deleteObject(imageRef);

    res.status(200).send({ message: "Imagem deletada com sucesso!" });
  } catch (error) {
    res.status(400).send({ error: error });
  }
});

router.post(
  "/updatePhotoUser",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const { currentUid } = await req.body;
      if (!req.file) {
        res.status(400).send({ error: "Arquivo não enviado." });
        return;
      }
      // usando o uid do usuário como path
      const uploadRef = ref(storage, `profileUser/${currentUid}`);
      // convertendo o arquivo para imagem
      const metadata = { contentType: req.file.mimetype };
      // salvando a imagem na storage
      await uploadBytes(uploadRef, req.file.buffer, metadata);
      // baixando a imagem
      const download = await getDownloadURL(uploadRef);
      // salvando a imagem no nó do usuário
      await updateDoc(doc(firestore, "users", currentUid), {
        urlPhoto: download,
      });

      res.status(200).send({ message: "Imagem salva com sucesso!" });
    } catch (error) {
      res.status(400).send(error);
    }
  }
);

router.post(
  "/registerAd",
  upload.array("images", 10),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).send({ error: "Nenhum arquivo foi enviado." });
        return;
      }

      const storage = getStorage();

      // Upload das imagens
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const imageName = `${uuidv4()}_${file.originalname}`;
          const storagePath = `images/${data.uidUser}/${imageName}`;

          const storageRef = ref(storage, storagePath);

          const metadata = { contentType: file.mimetype };
          await uploadBytes(storageRef, file.buffer, metadata);

          const downloadURL = await getDownloadURL(storageRef);

          return {
            name: imageName,
            uid: data.uidUser,
            url: downloadURL,
          };
        })
      );

      // Dados gerais
      const carDoc = {
        name: String(data.name).toUpperCase(),
        model: String(data.model).toUpperCase(),
        whatsapp: data.whatsapp,
        city: data.city,
        uf: data.uf,
        year: data.year,
        km: data.km,
        price: data.price,
        description: data.description,
        created: new Date().toISOString(),
        owner: data.owner,
        uidUser: data.uidUser,
        images: uploadedImages,
        fuel: data.fuel,
        transmission: data.transmission,
        engine: data.engine,
        documentationStatus: data.documentationStatus,
        maintenanceHistory: data.maintenanceHistory,
        generalCondition: data.generalCondition,
      };

      // Salvar no Firestore
      const docRef = await addDoc(collection(firestore, "cars"), carDoc);

      res.status(200).send({
        message: "Anúncio cadastrado com sucesso!",
        id: docRef.id,
      });
    } catch (error) {
      console.error("Erro no processamento da requisição:", error);
      res.status(500).send({ message: "Erro interno no servidor", error });
    }
  }
);

router.delete("/deletePhotoUser", async (req, res) => {
  try {
    const { uid } = req.body;

    const docRef = ref(storage, `profileUser/${uid}`);
    await getMetadata(docRef);

    await deleteObject(docRef);

    await updateDoc(doc(firestore, "users", uid), {
      urlPhoto: "",
    });

    res.status(200).send({ message: "Foto deletada com sucesso!" });
  } catch (error: any) {
    if (error.code === "storage/object-not-found") {
      res.status(404).send({ error: "Imagem não encontrada." });
    } else {
      res.status(400).send({ error: "Erro ao tentar deletar imagem." });
    }
  }
});

export default router;
