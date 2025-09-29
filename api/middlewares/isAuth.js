"use strict";
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const Admin = require("../models/admin");

/** Vérifie si la requête a un token JWT valide */

module.exports = async (req, res, next) => {
  // Récupère le jeton depuis l'en-tête Authorization de la requête
  const authHeader = req.get("Authorization");

  // Vérifie si l'en-tête Authorization est présent
  if (!authHeader) {
    return res.status(401).json({ error: "Non authentifié." });
  }

  // Récupère le jeton JWT
  const token = authHeader.split(" ")[1];
  let decodedToken;

  try {
    // Vérifie le jeton et récupére les données associées
    decodedToken = jwt.verify(token, process.env.SECRET_JWT);
    console.log(decodedToken);

    if (decodedToken.exp < Date.now() / 1000) {
      return res.status(401).json({
        status: 401,
        error: "Unauthorized",
        message: "Session expirée",
        data: null,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    const admin = await Admin.findById(decodedToken.id);
    if (!admin) {
      return res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "Administrateur inexistant",
        data: admin,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }

    // Ajoute les données associées à l'objet de requête pour utilisation ultérieure
    req.admin = admin;
    next();
  } catch (err) {
    err.statusCode = 401;
    return next(err);
  }
};
