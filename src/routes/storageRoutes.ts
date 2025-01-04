import express from "express";
import {
  deleteObject,
  getDownloadURL,
  getMetadata,
  ref,
  uploadBytes,
} from "firebase/storage";
import multer from "multer";
import { firestore, storage } from "../config/firebaseConfig";
import { doc, updateDoc } from "@firebase/firestore";

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

router.delete("/deleteImgAd", async (req, res) => {
  const images = req.body;

  images.map(async (image: any) => {
    const imagePath = `images/${image.uid}/${image.name}`;
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef)
      .then(() =>
        res.status(200).send({ message: "Imagem excluída com sucesso!" })
      )
      .catch((error) => res.status(400).send(error));
  });
});

router.post("/updatePhotoUser", upload.single("image"), async (req, res) => {
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
});

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
