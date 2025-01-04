import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "../config/firebaseConfig";
import { IUser } from "../models";
import { doc, getDoc, setDoc } from "@firebase/firestore";

/**
 * Verificando se possui usuário autenticado.
 * @returns
 */
export const handleAuthStateChanged = async (): Promise<IUser | null> => {
  return new Promise((resolve, reject) => {
    try {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const dataUser = await getDoc(doc(firestore, "users", user.uid));

          resolve(dataUser.data() as IUser);
        } else {
          resolve(null);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};
