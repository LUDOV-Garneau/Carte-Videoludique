"use strict";

const Marqueur = require("../models/Marqueur");

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
 * 
 * @returns {void} Cette fonction ne retourne rien directement, elle envoie une réponse JSON ou passe une erreur à `next`.
 * 
 * @throws {Error} Passe une erreur à `next` en cas de problème lors de l'enregistrement du marqueur.
 */
exports.createMarqueur = async (req, res, next) => {
  try {
    const form = req.body;
    const isAdmin = req.admin !== null && req.admin !== undefined;


    // Validation des champs requis
    if (!form.titre || !form.description) {
      return res.status(400).json(formatErrorResponse(
        400,
        "Bad Request",
        "Paramètres manquants : titre ou description",
        req.originalUrl
      ));
    }

    // Défaut pour type
    if (!form.type || form.type.trim() === '') {
      form.type = 'Autres';
    }

    // Création du marqueur conforme au modèle GeoJSON
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
 * @param {import('express').Request} req - Objet de requête Express.
 * @param {import('express').Response} res - Objet de réponse Express utilisé pour envoyer la liste des marqueurs en JSON.
 * @param {import('express').NextFunction} next - Fonction middleware pour gérer les erreurs.
 * 
 * @returns {void} Cette fonction ne retourne rien directement, elle envoie une réponse JSON ou passe une erreur à `next`.
 * 
 * @throws {Error} Passe une erreur à `next` en cas de problème lors de la récupération.
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
 * Récupère un marqueur en fonction de son identifiant et le renvoie en réponse JSON.
 * 
 * @param {import('express').Request} req - Objet de requête Express contenant l'ID du marqueur dans `req.params.marqueurId`.
 * @param {import('express').Response} res - Objet de réponse Express utilisé pour envoyer le marqueur en JSON.
 * @param {import('express').NextFunction} next - Fonction middleware pour gérer les erreurs.
 * 
 * @returns {void} Cette fonction ne retourne rien directement, elle envoie une réponse JSON ou passe une erreur à `next`.
 * 
 * @throws {Error} Renvoie une erreur 404 si le marqueur n'existe pas.
 */
exports.getMarqueur = async (req, res, next) => {
    try {
        const marqueurId = req.params.marqueurId;

        const marqueur = await Marqueur.findById(marqueurId);
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
 * Tous les champs du marqueur peuvent être modifiés.
 * 
 * @param {import('express').Request} req - Objet de requête Express contenant l'ID du marqueur dans `req.params.marqueurId` et les nouvelles données dans `req.body`.
 * @param {import('express').Response} res - Objet de réponse Express utilisé pour envoyer le marqueur mis à jour.
 * @param {import('express').NextFunction} next - Fonction middleware pour gérer les erreurs.
 * 
 * @returns {void} Cette fonction ne retourne rien directement, elle envoie une réponse JSON ou passe une erreur à `next`.
 * 
 * @throws {Error} Renvoie une erreur 404 si le marqueur n'existe pas.
 */
exports.updateMarqueur = async (req, res, next) => {
    try {
        const marqueurId = req.params.marqueurId;
        const { titre, type, adresse, description, temoignage, image, images } = req.body;

        // Utiliser la syntaxe de chemin imbriqué pour properties
        const updateData = {
            $set: {}
        };
        
        if (titre !== undefined) updateData.$set["properties.titre"] = titre;
        if (type !== undefined) updateData.$set["properties.type"] = type;
        if (adresse !== undefined) updateData.$set["properties.adresse"] = adresse;
        if (description !== undefined) updateData.$set["properties.description"] = description;
        if (temoignage !== undefined) updateData.$set["properties.temoignage"] = temoignage;
        if (image !== undefined) updateData.$set["properties.image"] = image;
        // If lat/lng are provided (from the edit form), update geometry coordinates (GeoJSON expects [lng, lat])
        if (req.body.lat !== undefined && req.body.lng !== undefined) {
          const lat = req.body.lat === null || req.body.lat === '' ? null : parseFloat(req.body.lat);
          const lng = req.body.lng === null || req.body.lng === '' ? null : parseFloat(req.body.lng);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            updateData.$set["geometry.coordinates"] = [lng, lat];
          }
        }

        if (images !== undefined) {
            // Normaliser les images : accepter soit un tableau d'objets { publicId, url }, soit un tableau de chaînes (urls)
            const normalized = (Array.isArray(images))
                ? images.map(img => (typeof img === 'string' ? { url: img } : img))
                : [];
            updateData.$set["properties.images"] = normalized;
        }

        const updatedMarqueur = await Marqueur.findByIdAndUpdate(
            marqueurId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedMarqueur) {
            return res.status(404).json(formatErrorResponse(
                404,
                "Not Found",
                "Le marqueur à mettre à jour n'existe pas",
                req.originalUrl
            ));
        }

        res.status(200).json(formatSuccessResponse(
            200,
            "Le marqueur a été mis à jour avec succès!",
            updatedMarqueur,
            req.originalUrl
        ));

    } catch (err) {
        next(err);
    }
};

/**
 * Met à jour le statut d’un marqueur (approved, pending, rejected).
 * Accessible uniquement aux administrateurs.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.updateStatusMarqueur = async (req, res, next) => {
  try {
    const marqueurId = req.params.marqueurId;
    const { status } = req.body;

    const allowedStatuses = ["approved", "pending", "rejected"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json(formatErrorResponse(
        400,
        "Bad Request",
        "Statut invalide. Valeurs acceptées : 'approved', 'pending' ou 'rejected'.",
        req.originalUrl
      ));
    }

    if (!req.admin) {
      return res.status(403).json(formatErrorResponse(
        403,
        "Forbidden",
        "Seul un administrateur peut modifier le statut d’un marqueur.",
        req.originalUrl
      ));
    }

    const updatedMarqueur = await Marqueur.findByIdAndUpdate(
      marqueurId,
      { $set: { "properties.status": status } },
      { new: true, runValidators: true, context: "query" }
    );

    if (!updatedMarqueur) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "Le marqueur à mettre à jour n'existe pas.",
        req.originalUrl
      ));
    }

    res.status(200).json(formatSuccessResponse(
      200,
      `Le statut du marqueur a été mis à jour vers '${status}'.`,
      updatedMarqueur,
      req.originalUrl
    ));

  } catch (err) {
    next(err);
  }
};


exports.addCommentMarqueur = async (req, res, next) => {
  try {
    const { marqueurId } = req.params;
    const { auteur, texte } = req.body;

    // On cherche le marqueur en premier
    const marqueur = await Marqueur.findById(marqueurId);

    if (!marqueur) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "Le marqueur spécifié n'existe pas.",
        req.originalUrl
      ));
    }

    // Ensuite on valide le texte
    if (!texte || texte.trim() === "") {
      return res.status(400).json(formatErrorResponse(
        400,
        "Bad Request",
        "Le contenu du témoignage est requis.",
        req.originalUrl
      ));
    }

    const newComment = { auteur: auteur || "Anonyme", contenu: texte };
    marqueur.properties.comments.push(newComment);
    await marqueur.save();

    res.status(200).json(formatSuccessResponse(
      200,
      "Témoignage ajouté avec succès.",
      marqueur,
      req.originalUrl
    ));
  } catch (err) {
    next(err); // <---- ce que le test vérifie
  }
};


/**
 * Supprime un commentaire spécifique d’un marqueur existant.
 * 
 * @param {import('express').Request} req - Objet de requête Express contenant les IDs du marqueur et du commentaire.
 * @param {import('express').Response} res - Objet de réponse Express utilisé pour renvoyer le marqueur mis à jour.
 * @param {import('express').NextFunction} next - Fonction middleware pour gérer les erreurs.
 */
exports.deleteCommentMarqueur = async (req, res, next) => {
  try {
    const { marqueurId, commentId } = req.params;

    // Cherche le marqueur
    const marqueur = await Marqueur.findById(marqueurId);
    if (!marqueur) {
      return res.status(404).json(formatErrorResponse(
        404,
        "Not Found",
        "Le marqueur spécifié n'existe pas.",
        req.originalUrl
      ));
    }

    // Trouve l'index du commentaire à supprimer
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

    // Supprime le commentaire
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
 * @param {import('express').Request} req - Objet de requête Express contenant l'ID du marqueur dans `req.params.marqueurId`.
 * @param {import('express').Response} res - Objet de réponse Express utilisé pour envoyer la confirmation de suppression.
 * @param {import('express').NextFunction} next - Fonction middleware pour gérer les erreurs.
 * 
 * @returns {void} Cette fonction ne retourne rien directement, elle envoie une réponse JSON ou passe une erreur à `next`.
 * 
 * @throws {Error} Renvoie une erreur 404 si le marqueur n'existe pas.
 */
exports.deleteMarqueur = async (req, res, next) => {
    try {
        const marqueurId = req.params.marqueurId;

        const deletedMarqueur = await Marqueur.findByIdAndDelete(marqueurId);
        if (!deletedMarqueur) {
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
            deletedMarqueur,
            req.originalUrl
        ));
    } catch (err) {
        next(err);
    }
};
