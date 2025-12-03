"use strict";

const Categorie = require("../models/categorie");
const dotenv = require("dotenv");
const { formatErrorResponse, formatSuccessResponse } = require("../utils/formatErrorResponse");

dotenv.config();

/**
 * Crée une nouvelle catégorie
 * Renvoie la catégorie créée en réponse JSON avec un status 201 et un header `Location`
 * 
 * @param {import('express').Request} req - Objet de requête Express contenant les données du marqueur dans `req.body`.
 * @param {import('express').Response} res - Objet de réponse Express utilisé pour envoyer le marqueur créé.
 * @param {import('express').NextFunction} next - Fonction middleware pour gérer les erreurs.
 */
exports.createCategorie = async (req, res, next) => {
    try {
        const form = req.body;

        if (!form.nom) {
            return res.status(400).json(formatErrorResponse(
                400,
                "Bad Request",
                "Un nom de catégorie est requis.",
                req.originalUrl
            ));
        }

        if (form.couleur && !/^#[0-9A-F]{6}$/i.test(form.couleur)) {
            return res.status(400).json(formatErrorResponse(
                400,
                "Bad Request",
                "Le code couleur doit être un code hexadécimal valide (ex: #FF5733).",
                req.originalUrl
            ));
        }

        if (form.description && form.description.length > 200) {
            return res.status(400).json(formatErrorResponse(
                400,
                "Bad Request",
                "La description ne doit pas dépasser 200 caractères.",
                req.originalUrl
            ));
        }

        const categorie = new Categorie({
            nom: form.nom,
            image: form.image,
            description: form.description || "",
            couleur: form.couleur,
        });

        const result = await categorie.save();

        res.location(`/categories/${result._id}`);
        res.status(201).json(formatSuccessResponse(
            201,
            "La catégorie a été créée avec succès.",
            result,
            req.originalUrl
        ));
    } catch (err) {
        next(err);
    }
}