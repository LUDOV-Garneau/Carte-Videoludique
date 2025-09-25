"use strict";

const {formatErrorResponse} = require('../utils/formatErrorResponse.js'); // Import de la fonction utilitaire

exports.get404 = (req, res, next) => {
  res.status(404).json(formatErrorResponse(
    404,
    "Not Found",
    "La ressource demandée est introuvable.",
    req.originalUrl
  ));
};

exports.getErrors = (err, req, res, next) => {
  console.log('err', err);
  
  let statusCode = err.statusCode || 500;
  let errorType = "Internal Server Error";
  let message = err.message || "Une erreur interne est survenue.";

  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    errorType = "Not Found";
    message = `L'id fourni est invalide ou n'existe pas : ${err.value}`;
  }

 if (err.name === "ValidationError") {
  statusCode = 400;
  errorType = "Bad Request";
  message = `Erreur de validation : ${Object.values(err.errors).map(e => e.message).join(", ")}`;
}

   res.status(statusCode).json(formatErrorResponse(
    statusCode,
    errorType,
    message,
    req.originalUrl
  ));
}