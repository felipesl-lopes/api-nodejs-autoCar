import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  setDoc,
  arrayUnion,
  arrayRemove,
} from "@firebase/firestore";
import express from "express";
import multer from "multer";
import { firestore, storage } from "../config/firebaseConfig";
import { ICarList, IFormNewCar, ISliders_Home } from "../models";
import { deleteObject, ref } from "@firebase/storage";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/carDetails/:id", async (req, res) => {
  const { id } = req.params;

  const carRef = doc(firestore, "cars", id as string);

  await getDoc(carRef)
    .then(async (snapshot) => {
      const doc = snapshot.data();

      if (!doc) {
        return res.status(400).send({ message: "Esse id não existe" });
      }

      let num = doc?.whatsapp;

      let data: IFormNewCar = {
        city: doc?.city,
        created: doc?.created,
        description: doc?.description,
        km: parseFloat(doc?.km).toLocaleString("pt-BR"),
        model: doc?.model,
        uf: doc?.uf,
        name: doc?.name,
        owner: doc?.owner,
        price: parseFloat(doc?.price).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        }),
        uidUser: doc?.uidUser,
        whatsapp: `(${num.slice(0, 2)})${num.slice(2, 7)}-${num.slice(7, 12)}`,
        year: doc?.year,
        images: doc?.images,

        fuel: doc?.fuel,
        transmission: doc?.transmission,
        engine: doc?.engine,
        documentationStatus: doc?.documentationStatus,
        maintenanceHistory: doc?.maintenanceHistory,
        generalCondition: doc?.generalCondition,
      };
      return res.status(200).send(data);
    })
    .catch((error) => res.status(400).send(error));
});

router.get("/carList", async (req, res) => {
  const carRef = collection(firestore, "cars");

  getDocs(carRef)
    .then((snapshot) => {
      let list: ICarList[] = [];
      snapshot.forEach((doc) => {
        list.push({
          city: doc.data().city,
          uf: doc.data().uf,
          uidUser: doc.data().uidUser,
          model: doc.data().model,
          id: doc.id,
          name: doc.data().name,
          year: doc.data().year,
          price: parseFloat(doc.data().price).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          }),
          km: parseFloat(doc.data().km).toLocaleString("pt-BR"),
          images: doc.data().images[0].url,
        });
      });
      return res.status(200).send(list as ICarList[]);
    })
    .catch((error) => res.status(400).send(error));
});

router.get("/sliders", async (req, res) => {
  const refSliders = collection(firestore, "sliders-home");

  await getDocs(refSliders)
    .then((snapshot) => {
      let list = [] as ISliders_Home[];

      snapshot.forEach((doc) => {
        list.push({
          route: doc.data().route,
          url: doc.data().url,
          color: doc.data().color,
        });
      });
      return res.status(200).send(list);
    })
    .catch((error) => res.status(400).send(error));
});

router.delete("/deleteAd/:id", async (req, res) => {
  try {
    const { imgList } = req.body;
    const { id } = req.params;

    const docRef = doc(firestore, "cars", id);
    await deleteDoc(docRef);

    imgList.map(async (item: any) => {
      const imagePath = `images/${item.uid}/${item.name}`;
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef).catch((error) => {
        return res.status(400).send(error);
      });
    });
    res.status(200).send({ message: "Anúncio deletado com sucesso!" });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

router.patch("/updatePhoneUser", async (req, res) => {
  const { whatsapp, uid } = req.body;

  await updateDoc(doc(firestore, "users", uid), {
    whatsapp: whatsapp,
  })
    .then(() =>
      res.status(200).send({ message: "Telefone atualizado com sucesso!" })
    )
    .catch((error) => res.status(400).send(error));
});

router.patch("/updateAddressUser", async (req, res) => {
  const { city, uf, uid } = req.body;

  await updateDoc(doc(firestore, "users", uid), {
    uf: uf,
    city: city,
  })
    .then(() =>
      res.status(200).send({ message: "Endereço atualizado com sucesso!" })
    )
    .catch((error) => res.status(400).send(error));
});

router.get("/searchCar", async (req, res) => {
  const inputCar = req.query.inputCar as string;

  const carRef = query(
    collection(firestore, "cars"),
    where("name", ">=", inputCar.toUpperCase()),
    where("name", "<=", inputCar.toUpperCase() + "\uf8ff")
  );

  await getDocs(carRef)
    .then((snapshot) => {
      let list: ICarList[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          city: data.city,
          uf: data.uf,
          uidUser: data.uidUser,
          model: data.model,
          id: doc.id,
          name: data.name,
          year: data.year,
          price: parseFloat(data.price).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          }),
          km: parseFloat(data.km).toLocaleString("pt-BR"),
          images: data.images?.[0]?.url || null,
        });
      });
      return res.status(200).send(list as ICarList[]);
    })
    .catch((error) => res.status(400).send(error));
});

router.post("/favorite", async (req, res) => {
  const { uidUser, idCar } = req.body;

  const docRef = doc(firestore, "favorite", uidUser);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    await setDoc(docRef, {
      uidCar: [idCar],
    });
  } else {
    await updateDoc(docRef, {
      uidCar: arrayUnion(idCar),
    });
  }

  res.status(200).send("Carro adicionado aos favoritos.");
});

router.delete("/favorite", async (req, res) => {
  const { uidUser, idCar } = req.body;

  const docRef = doc(firestore, "favorite", uidUser);

  await updateDoc(docRef, {
    uidCar: arrayRemove(idCar),
  });

  res.status(200).send("Carro removido dos favoritos.");
});

router.get("/favorite", async (req: any, res: any) => {
  const { uidUser, idCar } = req.query;

  const docRef = doc(firestore, "favorite", uidUser);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return res.status(200).json({ favorite: false });
  }

  const uidCarList = docSnap.data().uidCar || [];
  const isFavorite = uidCarList.includes(idCar);

  res.status(200).json({ favorite: isFavorite });
});

router.get("/carList/favorites", async (req, res: any) => {
  const { uidUser } = req.query;

  try {
    // Pega a lista de IDs favoritados
    const favRef = doc(firestore, "favorite", uidUser as string);
    const favSnap = await getDoc(favRef);

    if (!favSnap.exists()) {
      return res.status(200).json([]);
    }

    const uidCarList: string[] = favSnap.data().uidCar || [];

    // Agora busca todos os veículos
    const carRef = collection(firestore, "cars");
    const snapshot = await getDocs(carRef);

    const list: ICarList[] = [];

    snapshot.forEach((doc) => {
      if (uidCarList.includes(doc.id)) {
        list.push({
          city: doc.data().city,
          uf: doc.data().uf,
          uidUser: doc.data().uidUser,
          model: doc.data().model,
          id: doc.id,
          name: doc.data().name,
          year: doc.data().year,
          price: parseFloat(doc.data().price).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          }),
          km: parseFloat(doc.data().km).toLocaleString("pt-BR"),
          images: doc.data().images[0].url,
        });
      }
    });

    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar favoritos." });
  }
});

export default router;
