"use strict";
const { formatErrorResponse} = require("../utils/formatErrorResponse");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const Admin = require("../models/admin");

/** Vérifie si la requête a un token JWT valide (Bearer obligatoire) */
module.exports = async (req, res, next) => {
  const authHeader = req.get("Authorization");

  // 1) Header manquant OU ne commence pas par "Bearer "
  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) {
    return res
      .status(401)
      .json(
        formatErrorResponse(401, "Unauthorized", "Non authentifié.", req.originalUrl)
      );
  }

  // 2) Extraire le token après "Bearer "
  const token = authHeader.split(" ")[1];
  console.log(token.value)
  if (!token) {
    return res
      .status(401)
      .json(
        formatErrorResponse(401, "Unauthorized", "Non authentifié.", req.originalUrl)
      );
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_JWT);

    // 3) Payload invalide
    if (!decoded || typeof decoded !== "object" || !decoded.id) {
      return res
        .status(401)
        .json(
          formatErrorResponse(
            401,
            "Unauthorized",
            "Token invalide ou non vérifié.",
            req.originalUrl
          )
        );
    }

    // 4) Expiration
    if (typeof decoded.exp === "number" && decoded.exp < Date.now() / 1000) {
      return res
        .status(401)
        .json(
          formatErrorResponse(401, "Unauthorized", "Session expirée.", req.originalUrl)
        );
    }

    // 5) Admin
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Administrateur inexistant.",
            req.originalUrl
          )
        );
    }

    req.admin = admin;
    next();
  } catch (err) {
  if (err.name === "TokenExpiredError") {
    return res.status(401).json(formatErrorResponse(401, "Unauthorized", "Session expirée.", req.originalUrl));
  }
  return res.status(401).json(formatErrorResponse(401, "Unauthorized", "Token invalide.", req.originalUrl));
}
};