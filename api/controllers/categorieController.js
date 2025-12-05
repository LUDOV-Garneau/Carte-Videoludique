"use strict";

const Categorie = require("../models/categorie");
const mongoose = require("mongoose");
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

/**
 * Récupère toutes les catégories et les renvoie en réponse JSON
 * 
 * @param {import('express').Request} req - Objet de requête Express contenant les données du marqueur dans `req.body`.
 * @param {import('express').Response} res - Objet de réponse Express utilisé pour envoyer le marqueur créé.
 * @param {import('express').NextFunction} next - Fonction middleware pour gérer les erreurs.
 */
exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Categorie.find();

        res.status(200).json(formatSuccessResponse(
            200,
            "Liste des catégories récupérée avec succès.",
            categories,
            req.originalUrl
        ));
    } catch (err) {
        next(err);
    }
}

/**
 * Récupère une catégorie en fonction de son identifiant.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.getCategorie = async (req, res, next) => {
    try {
        const categorie = await Categorie.findById(req.params.categorieId);
        if (!categorie) {
            return res.status(404).json(formatErrorResponse(
                404,
                "Not Found",
                "Catégorie non trouvée.",
                req.originalUrl
            ));
        }

        res.status(200).json(formatSuccessResponse(
            200,
            "Catégorie récupérée avec succès.",
            categorie,
            req.originalUrl
        ));
    } catch (err) {
        next(err);
    }
}

/**
 * Mettre à jour une catégorie existante en fonction de son identifiant.
 * Ne gère PAS l'ordre (voir updateCategorieOrdre pour cela)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.updateCategorie = async (req, res, next) => {
    try {
        const { categorieId } = req.params;
        const form = req.body;
        const updateData = {};

        // Validation du nom si fourni
        if (form.nom !== undefined) {
            if (!form.nom.trim()) {
                return res.status(400).json(formatErrorResponse(
                    400,
                    "Bad Request",
                    "Un nom de catégorie est requis.",
                    req.originalUrl
                ));
            }
            updateData.nom = form.nom.trim();
        }

        // Validation de la couleur si fournie
        if (form.couleur !== undefined) {
            if (form.couleur && !/^#[0-9A-F]{6}$/i.test(form.couleur)) {
                return res.status(400).json(formatErrorResponse(
                    400,
                    "Bad Request",
                    "Le code couleur doit être un code hexadécimal valide (ex: #FF5733).",
                    req.originalUrl
                ));
            }
            updateData.couleur = form.couleur;
        }

        // Validation de la description si fournie
        if (form.description !== undefined) {
            if (form.description && form.description.length > 200) {
                return res.status(400).json(formatErrorResponse(
                    400,
                    "Bad Request",
                    "La description ne doit pas dépasser 200 caractères.",
                    req.originalUrl
                ));
            }
            updateData.description = form.description;
        }

        // Gestion de l'image si fournie
        if (form.image) {
            // Validation de la structure de l'image
            if (!form.image.type || !["predefined", "uploaded", "url"].includes(form.image.type)) {
                return res.status(400).json(formatErrorResponse(
                    400,
                    "Bad Request",
                    "Type d'image invalide. Doit être 'predefined', 'uploaded' ou 'url'.",
                    req.originalUrl
                ));
            }

            // Validation selon le type d'image
            if (form.image.type === "predefined" && !form.image.filename) {
                return res.status(400).json(formatErrorResponse(
                    400,
                    "Bad Request",
                    "Le nom de fichier est requis pour une image prédéfinie.",
                    req.originalUrl
                ));
            }

            if (form.image.type === "url" && !form.image.externalUrl) {
                return res.status(400).json(formatErrorResponse(
                    400,
                    "Bad Request",
                    "L'URL externe est requise pour une image URL.",
                    req.originalUrl
                ));
            }

            updateData.image = form.image;
        }

        // Mise à jour de la catégorie
        const updatedCategorie = await Categorie.findByIdAndUpdate(
            categorieId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedCategorie) {
            return res.status(404).json(formatErrorResponse(
                404,
                "Not Found",
                "Catégorie non trouvée.",
                req.originalUrl
            ));
        }

        res.status(200).json(formatSuccessResponse(
            200,
            "Catégorie mise à jour avec succès.",
            updatedCategorie,
            req.originalUrl
        ));
    } catch (err) {
        next(err);
    }
}

/**
 * Met à jour l'ordre des catégories basé sur un array d'IDs
 * Utilisé pour le drag & drop dans l'interface d'administration
 *
 * @param {import('express').Request} req - req.body.ordreCategories: Array<string> des IDs dans le nouvel ordre
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.updateCategorieOrdre = async (req, res, next) => {
    try {
        const { ordreCategories } = req.body;

        if (!Array.isArray(ordreCategories) || ordreCategories.length === 0) {
            return res.status(400).json(formatErrorResponse(
                400,
                "Bad Request",
                "Un tableau d'IDs de catégories est requis.",
                req.originalUrl
            ));
        }

        // Mise à jour en lot avec transaction pour la cohérence
        const session = await mongoose.startSession();
        
        try {
            await session.withTransaction(async () => {
                const updatePromises = ordreCategories.map((categorieId, index) => 
                    Categorie.findByIdAndUpdate(
                        categorieId,
                        { ordre: index },
                        { session, runValidators: true }
                    )
                );

                await Promise.all(updatePromises);
            });

            await session.endSession();

            // Récupérer les catégories mises à jour
            const categoriesUpdated = await Categorie.find()
                .sort({ ordre: 1, nom: 1 });

            res.status(200).json(formatSuccessResponse(
                200,
                "Ordre des catégories mis à jour avec succès.",
                categoriesUpdated,
                req.originalUrl
            ));
        } catch (transactionError) {
            await session.endSession();
            throw transactionError;
        }
    } catch (err) {
        next(err);
    }
}