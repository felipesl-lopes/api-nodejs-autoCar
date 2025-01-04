import { doc, getDoc, setDoc } from "@firebase/firestore";
import express from "express";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { auth, firestore } from "../config/firebaseConfig";
import { handleAuthStateChanged } from "../services/authServices";

const router = express.Router();

/**
 * Função para logar usuário.
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  await signInWithEmailAndPassword(auth, email, password)
    .then(async ({ user }) => {
      const dataUser = await getDoc(doc(firestore, "users", user.uid));

      return res.status(200).send(dataUser.data());
    })
    .catch((error) => {
      return res.status(401).send(error);
    });
});

/**
 * Função para cadastrar um usuário.
 * Atualização de perfil incluindo o nome.
 * Envio de e-mail para verificação de conta.
 */
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  await createUserWithEmailAndPassword(auth, email, password)
    .then(async ({ user }) => {
      await updateProfile(user, { displayName: name });
      await setDoc(doc(firestore, "users", user.uid), {
        name: user.displayName,
        email: user.email,
        uid: user.uid,
        uf: "",
        city: "",
        whatsapp: "",
      });

      await sendEmailVerification(user);

      return res.status(200).send(user.email);
    })
    .catch((error) => {
      return res.status(400).send(error);
    });
});

/**
 * Função para recuperação de senha.
 */
router.post("/recoverPassword", async (req, res) => {
  await sendPasswordResetEmail(auth, req.body.email)
    .then(() => {
      return res.status(200).send({ message: "E-mail enviado." });
    })
    .catch((error) => {
      return res.status(400).send(error);
    });
});

/**
 * Verificar autenticidade
 */
router.get("/login", async (req, res) => {
  await handleAuthStateChanged()
    .then((data) => {
      res.status(200).send(data);
    })
    .catch((error) => res.status(401).json(error));
});

/**
 * Deslogar
 */
router.get("/logout", async (req, res) => {
  await signOut(auth)
    .then(() => {
      res.status(200).send({ message: "Usuário deslogado" });
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// Verificar validação de e-mail
router.get("/validation", async (req, res) => {
  try {
    const user = getAuth().currentUser;
    res.status(200).send(user?.emailVerified);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Essa função só funciona quando o usuário acaba de ser criado, ou quando o usuário está logado
router.post("/verifieldEmail", async (req, res) => {
  const currentUser = auth.currentUser;

  await sendEmailVerification(currentUser as User)
    .then(() => {
      res.status(200).send({ message: "E-mail enviado para o usuário." });
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

export default router;
