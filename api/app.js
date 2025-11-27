"use strict";

const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");

const allowedOrigins = [

  //Accès pour le frontend localhost
  'http://localhost:5173',

  //Accès pour le site ludov officiel
  'https://ludov.ca',
  
  //Autorisation pour l'adresse github du site
  'https://ludov-garneau.github.io/Carte-Videoludique/'  
]

app.use(cors({
  origin: function (origin, callback) {
    console.log("🌐 CORS origin reçue :", origin);
    if (!origin) return callback(null, true); 

    if (allowedOrigins.includes(origin)) {
      console.log("✅ Origin autorisée :", origin);
      return callback(null, true);
    }

    console.log("❌ Origin refusée :", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const adminRoutes = require("./routes/admin");

const marqueurRoutes = require("./routes/marqueur")
const cloudinaryRoutes = require("./routes/cloudinary");
const editRequestRoutes = require("./routes/editRequest");

// app.use(seed);
app.use((req, res, next) => {
  console.log('[REQ]', req.method, req.originalUrl);
  next();
});
app.use(adminRoutes);
app.use(marqueurRoutes);
app.use(cloudinaryRoutes);
app.use(editRequestRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const code = err.status || 500;
  res.status(code).json({ message: err.message || "Erreur serveur." });
});

console.log("DATA_BASE =", process.env.DATA_BASE);

//Connexion MongoDB + lancement serveur
mongoose
  .connect(process.env.DATA_BASE)
  .then(() => {
    console.log("✅ MongoDB connecté");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Serveur à l'écoute sur : http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

module.exports = app;
