"use strict";

const Marqueur = require("../models/marqueur");
const dotenv = require("dotenv");
const { formatErrorResponse, formatSuccessResponse } = require("../utils/formatErrorResponse");

dotenv.config();

/**
 * Crée un nouveau Marqueur et le sauvegarde en base de données.
 * Renvoie le marqueur créé en réponse JSON avec un statut 201 et un header `Location`.
 * 
 * @param {import('express').Request} req - Objet de requête Express contenant les données du marqueur dans `req.body`.
 * @param {import('express').Response} res - Objet de réponse Express utilisé pour envoyer le marqueur créé.
 * @param {import('express').NextFunction} next - Fonction middleware pour gérer les erreurs.
 */
exports.createMarqueur = async (req, res, next) => {
  try {
    const form = req.body;
    const isAdmin = req.admin !== null && req.admin !== undefined;

    if (!form.titre || !form.description) {
      return res.status(400).json(formatErrorResponse(
        400,
        "Bad Request",
        "Paramètres manquants : titre ou description",
        req.originalUrl
      ));
    }

    if (!form.type || form.type.trim() === "") {
      form.type = "Autres";
    }

    const marqueur = new Marqueur({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [parseFloat(form.lng), parseFloat(form.lat)]
      },
      properties: {
        titre: form.titre,
        type: form.type,
        adresse: form.adresse,
        description: form.description,
        temoignage: form.souvenir,
        courriel: form.email,
        images: form.images || [],
        status: isAdmin ? "approved" : "pending",
        createdByName: form.nom || "Anonyme"
      }
    });

    const result = await marqueur.save();

    res.location(`/marqueurs/${result._id}`);
    res.status(201).json(formatSuccessResponse(
      201,
      "Le marqueur a été créé avec succès !",
      result,
      req.originalUrl
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Récupère tous les marqueurs et les renvoie en réponse JSON.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.getMarqueurs = async (req, res, next) => {
  try {
    const marqueurs = await Marqueur.find();

    res.status(200).json(formatSuccessResponse(
      200,
      "Les marqueurs ont été récupérés avec succès!",
      marqueurs,
      req.originalUrl
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Récupère un marqueur en fonction de son identifiant.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.getMarqueur = async (req, res, next) => {
  try {
    const marqueur = await Marqueur.findById(req.params.marqueurId);

    if (!marqueur) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "Le marqueur spécifié n'existe pas",
        req.originalUrl
      ));
    }

    res.status(200).json(formatSuccessResponse(
      200,
      "Marqueur trouvé",
      marqueur,
      req.originalUrl
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Met à jour un marqueur existant en fonction de son identifiant.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.updateMarqueur = async (req, res, next) => {
  try {
    const id = req.params.marqueurId || req.params.id;

    const {
      titre,
      type,
      adresse,
      description,
      temoignage,
      image
    } = req.body;

    const update = {
      $set: {
        "properties.titre": titre,
        "properties.type": type,
        "properties.adresse": adresse,
        "properties.description": description,
        "properties.temoignage": temoignage,
        "properties.image": image,
      }
    };

    const updated = await Marqueur.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "Le marqueur à mettre à jour n'existe pas",
        req.originalUrl
      ));
    }

    return res.status(200).json(formatSuccessResponse(
      200,
      "Le marqueur a été mis à jour avec succès!",
      updated,
      req.originalUrl
    ));

  } catch (err) {
    next(err);
  }
};


/**
 * Met à jour le statut d’un marqueur (approved, pending, rejected).
 * Si rejeté → suppression du marqueur.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.updateStatusMarqueur = async (req, res, next) => {
  try {
    const { marqueurId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["approved", "pending", "rejected"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json(formatErrorResponse(
        400,
        "Bad Request",
        "Statut invalide.",
        req.originalUrl
      ));
    }

    // 🔥 Si rejeté : suppression
    if (status === "rejected") {
      const deleted = await Marqueur.findByIdAndDelete(marqueurId);

      if (!deleted) {
        return res.status(404).json(formatErrorResponse(
          404,
          "Not Found",
          "Le marqueur à supprimer n'existe pas.",
          req.originalUrl
        ));
      }

      return res.status(200).json(formatSuccessResponse(
        200,
        "Marqueur supprimé (rejeté).",
        deleted,
        req.originalUrl
      ));
    }

    // 🔥 Sinon on met juste à jour le statut
    const updated = await Marqueur.findByIdAndUpdate(
      marqueurId,
      { $set: { "properties.status": status } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "Le marqueur à mettre à jour n'existe pas.",
        req.originalUrl
      ));
    }

    return res.status(200).json(formatSuccessResponse(
      200,
      `Statut mis à jour vers '${status}'`,
      updated,
      req.originalUrl
    ));

  } catch (err) {
    next(err);
  }
};

/**
 * Ajoute un commentaire (témoignage) à un marqueur existant.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.addCommentMarqueur = async (req, res, next) => {
  try {
    const { marqueurId } = req.params;
    const { auteur, texte } = req.body;

    if (!texte || texte.trim() === "") {
      return res.status(400).json(formatErrorResponse(
        400,
        "Bad Request",
        "Le contenu du témoignage est requis.",
        req.originalUrl
      ));
    }

    const marqueur = await Marqueur.findById(marqueurId);

    if (!marqueur) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "Le marqueur spécifié n'existe pas.",
        req.originalUrl
      ));
    }

    const comment = { auteur: auteur || "Anonyme", contenu: texte };
    marqueur.properties.comments.push(comment);
    await marqueur.save();

    res.status(201).json(formatSuccessResponse(
      201,
      "Témoignage ajouté avec succès.",
      comment,
      req.originalUrl
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Supprime un commentaire spécifique d’un marqueur existant.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.deleteCommentMarqueur = async (req, res, next) => {
  try {
    const { marqueurId, commentId } = req.params;

    const marqueur = await Marqueur.findById(marqueurId);

    if (!marqueur) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "Le marqueur spécifié n'existe pas.",
        req.originalUrl
      ));
    }

    const index = marqueur.comments.findIndex(
      (c) => c._id.toString() === commentId
    );

    if (index === -1) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "Le commentaire spécifié n'existe pas.",
        req.originalUrl
      ));
    }

    marqueur.comments.splice(index, 1);
    await marqueur.save();

    res.status(200).json(formatSuccessResponse(
      200,
      "Témoignage supprimé avec succès.",
      marqueur,
      req.originalUrl
    ));
  } catch (err) {
    next(err);
  }
};

/**
 * Supprime un marqueur en fonction de son identifiant.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.deleteMarqueur = async (req, res, next) => {
  try {
    const deleted = await Marqueur.findByIdAndDelete(req.params.marqueurId);

    if (!deleted) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "Le marqueur à supprimer n'existe pas",
        req.originalUrl
      ));
    }

    res.status(200).json(formatSuccessResponse(
      200,
      "Le marqueur a été supprimé avec succès!",
      deleted,
      req.originalUrl
    ));
  } catch (err) {
    next(err);
  }
};
