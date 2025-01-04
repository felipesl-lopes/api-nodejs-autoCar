import cors from "cors";
import express from "express";
import authRoutes from "../src/routes/authRoutes";
import firestoreRoutes from "../src/routes/firestoreRoutes";
import storageRoutes from "../src/routes/storageRoutes";

const app = express();
app.use(cors());
app.use(express.json());

// Registrando as rotas de autenticação
app.use("/api/auth", authRoutes);
app.use("/api/firestore", firestoreRoutes);
app.use("/api/storage", storageRoutes);

app.get("/", (req, res) => {
  res.send("API conectada");
});

app.listen(4000, () => {
  console.log("API funcionando na porta ", 4000);
});
