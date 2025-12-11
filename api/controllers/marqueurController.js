"use strict";

const Marqueur = require("../models/marqueur");
const Categorie = require("../models/categorie");
const dotenv = require("dotenv");
const {
  formatErrorResponse,
  formatSuccessResponse,
} = require("../utils/formatErrorResponse");

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
      return res
        .status(400)
        .json(
          formatErrorResponse(
            400,
            "Bad Request",
            "Paramètres manquants : titre ou description",
            req.originalUrl
          )
        );
    }

    if (!form.type || form.type.trim() === "") {
      form.type = "Autres";
    }

    const marqueur = new Marqueur({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [parseFloat(form.lat), parseFloat(form.lng)],
      },
      properties: {
        titre: form.titre,
        categorie: form.categorie,
        adresse: form.adresse,
        description: form.description,
        temoignage: form.souvenir,
        courriel: form.email,
        images: [],
        status: isAdmin ? "approved" : "pending",
        createdByName: form.nom || "Anonyme",
      },
    });

    const result = await marqueur.save();

    res.location(`/marqueurs/${result._id}`);
    res
      .status(201)
      .json(
        formatSuccessResponse(
          201,
          "Le marqueur a été créé avec succès !",
          result,
          req.originalUrl
        )
      );
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
    const marqueurs = await Marqueur.find({
      $or: [{ archived: false }, { archived: { $exists: false } }],
    });

    // filtrer les commentaires archivés pour tous les marqueurs
    marqueurs.forEach(
      (m) =>
        (m.properties.comments = m.properties.comments.filter(
          (c) => !c.archived
        ))
    );

    res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Les marqueurs ont été récupérés avec succès!",
          marqueurs,
          req.originalUrl
        )
      );
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
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Le marqueur spécifié n'existe pas",
            req.originalUrl
          )
        );
    }

    // enlever les commentaires archivés
    marqueur.properties.comments = marqueur.properties.comments.filter(
      (c) => !c.archived
    );

    res
      .status(200)
      .json(
        formatSuccessResponse(200, "Marqueur trouvé", marqueur, req.originalUrl)
      );
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

    const { titre, categorie, adresse, description, temoignage, image } =
      req.body;

    const update = {
      $set: {
        "properties.titre": titre,
        "properties.categorie": categorie,
        "properties.adresse": adresse,
        "properties.description": description,
        "properties.temoignage": temoignage,
        "properties.image": image,
      },
    };

    const updated = await Marqueur.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Le marqueur à mettre à jour n'existe pas",
            req.originalUrl
          )
        );
    }

    return res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Le marqueur a été mis à jour avec succès!",
          updated,
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};

/**
 * Met à jour le statut d’un marqueur (approved, pending, rejected).
 * Si rejeté → ARCHIVE maintenant (ne supprime plus définitivement !)
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
      return res
        .status(400)
        .json(
          formatErrorResponse(
            400,
            "Bad Request",
            "Statut invalide.",
            req.originalUrl
          )
        );
    }

    // Nouvelle logique : rejet = ARCHIVAGE (plus suppression !)
    if (status === "rejected") {
      const archived = await Marqueur.findByIdAndUpdate(
        marqueurId,
        { archived: true },
        { new: true }
      );

      if (!archived) {
        return res
          .status(404)
          .json(
            formatErrorResponse(
              404,
              "Not Found",
              "Le marqueur à archiver n'existe pas.",
              req.originalUrl
            )
          );
      }

      return res
        .status(200)
        .json(
          formatSuccessResponse(
            200,
            "Marqueur rejeté et archivé.",
            archived,
            req.originalUrl
          )
        );
    }

    // Sinon mise à jour normale du statut
    const updated = await Marqueur.findByIdAndUpdate(
      marqueurId,
      { $set: { "properties.status": status } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Le marqueur à mettre à jour n'existe pas.",
            req.originalUrl
          )
        );
    }

    return res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          `Statut mis à jour vers '${status}'`,
          updated,
          req.originalUrl
        )
      );
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
      return res
        .status(400)
        .json(
          formatErrorResponse(
            400,
            "Bad Request",
            "Le contenu du témoignage est requis.",
            req.originalUrl
          )
        );
    }

    const marqueur = await Marqueur.findById(marqueurId);
    if (!marqueur) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Le marqueur spécifié n'existe pas.",
            req.originalUrl
          )
        );
    }

    const comment = {
      auteur: auteur || "Anonyme",
      contenu: texte,
      status: "pending",
    };

    marqueur.properties.comments.push(comment);
    await marqueur.save();

    res
      .status(201)
      .json(
        formatSuccessResponse(
          201,
          "Témoignage ajouté et en attente d'approbation.",
          comment,
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.getPendingComments = async (req, res, next) => {
  try {
    const marqueurs = await Marqueur.find({
      "properties.comments.status": "pending",
    });

    const data = [];

    marqueurs.forEach((m) => {
      m.properties.comments
        .filter((c) => c.status === "pending")
        .forEach((c) => {
          data.push({
            marqueurId: m._id,
            marqueur: m,
            commentId: c._id,
            comment: c,
          });
        });
    });

    return res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Commentaires en attente récupérés.",
          data,
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.updateCommentStatus = async (req, res, next) => {
  try {
    const { marqueurId, commentId } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "approved", "rejected"];
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json(
          formatErrorResponse(
            400,
            "Bad Request",
            "Statut invalide.",
            req.originalUrl
          )
        );
    }

    const marqueur = await Marqueur.findById(marqueurId);
    if (!marqueur)
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Marqueur introuvable",
            req.originalUrl
          )
        );

    const comment = marqueur.properties.comments.id(commentId);
    if (!comment)
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Commentaire introuvable",
            req.originalUrl
          )
        );

    if (status === "rejected") {
      comment.deleteOne();
    } else {
      comment.status = status;
    }

    await marqueur.save();

    res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Statut du commentaire mis à jour.",
          comment,
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.getArchivedCommentaires = async (req, res, next) => {
  try {
    const marqueurs = await Marqueur.find({
      "properties.comments.archived": true,
    });

    const data = [];

    marqueurs.forEach((m) => {
      m.properties.comments
        .filter((c) => c.archived === true)
        .forEach((c) => {
          data.push({
            marqueurId: m._id,
            marqueur: m,
            commentId: c._id,
            comment: c,
          });
        });
    });

    return res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Commentaires archivés récupérés.",
          data,
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.archiveCommentaire = async (req, res, next) => {
  try {
    const { marqueurId, commentId } = req.params;

    const marqueur = await Marqueur.findById(marqueurId);
    if (!marqueur) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Marqueur introuvable.",
            req.originalUrl
          )
        );
    }

    const comment = marqueur.properties.comments.id(commentId);
    if (!comment) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Commentaire introuvable.",
            req.originalUrl
          )
        );
    }

    comment.archived = true;
    await marqueur.save();

    return res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Commentaire archivé.",
          comment,
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.restoreCommentaire = async (req, res, next) => {
  try {
    const { marqueurId, commentId } = req.params;

    const marqueur = await Marqueur.findById(marqueurId);
    if (!marqueur) {
      return res.status(404).json(formatErrorResponse(
        404, "Not Found", "Marqueur introuvable.", req.originalUrl
      ));
    }

    const comment = marqueur.properties.comments.id(commentId);
    if (!comment) {
      return res.status(404).json(formatErrorResponse(
        404, "Not Found", "Commentaire introuvable.", req.originalUrl
      ));
    }

    comment.archived = false;
    await marqueur.save();

    return res.status(200).json(formatSuccessResponse(
      200,
      "Commentaire restauré.",
      marqueur,       // 🔥 IMPORTANT : renvoyer tout le marqueur mis à jour
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
exports.deleteCommentaireDefinitif = async (req, res, next) => {
  try {
    const { marqueurId, commentId } = req.params;

    const marqueur = await Marqueur.findById(marqueurId);
    if (!marqueur) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Marqueur introuvable.",
            req.originalUrl
          )
        );
    }

    const index = marqueur.properties.comments.findIndex(
      (c) => c._id.toString() === commentId
    );

    if (index === -1) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Commentaire introuvable.",
            req.originalUrl
          )
        );
    }

    marqueur.properties.comments.splice(index, 1);
    await marqueur.save();

    return res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Commentaire supprimé définitivement.",
          null,
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};

/**
 * Met à jour les images d'un marqueur existant.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.updateMarqueurImages = async (req, res, next) => {
  try {
    const { marqueurId } = req.params;
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return res.status(400).json(formatErrorResponse(
        400,
        "Bad Request",
        "Le champ images doit être un tableau.",
        req.originalUrl
      ));
    }

    const updated = await Marqueur.findByIdAndUpdate(
      marqueurId,
      { $set: { "properties.images": images } },
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
      "Images mises à jour avec succès!",
      updated,
      req.originalUrl
    ));

  } catch (err) {
    next(err);
  }
};

/**
 * Archive un marqueur en fonction de son identifiant.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
exports.archiveMarqueur = async (req, res, next) => {
  try {
    const marqueur = await Marqueur.findByIdAndUpdate(
      req.params.marqueurId,
      { $set: { archived: true } },
      { new: true }
    );

    if (!marqueur) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Le marqueur n'existe pas",
            req.originalUrl
          )
        );
    }

    res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Le marqueur a été archivé.",
          marqueur,
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.restoreMarqueur = async (req, res, next) => {
  try {
    const marqueur = await Marqueur.findByIdAndUpdate(
      req.params.marqueurId,
      { $set: { archived: false } },
      { new: true }
    );

    if (!marqueur) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Marqueur introuvable.",
            req.originalUrl
          )
        );
    }

    res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Marqueur restauré.",
          marqueur,
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.getArchivedMarqueurs = async (req, res, next) => {
  try {
    const marqueurs = await Marqueur.find({ archived: true });

    res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Marqueurs archivés récupérés.",
          marqueurs,
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};

exports.deleteMarqueurDefinitif = async (req, res, next) => {
  try {
    const deleted = await Marqueur.findByIdAndDelete(req.params.marqueurId);

    if (!deleted) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            404,
            "Not Found",
            "Le marqueur n'existe pas.",
            req.originalUrl
          )
        );
    }

    res
      .status(200)
      .json(
        formatSuccessResponse(
          200,
          "Marqueur supprimé définitivement.",
          deleted,
          req.originalUrl
        )
      );
  } catch (err) {
    next(err);
  }
};

/**
 * Trouve ou crée une catégorie basée sur le nom
 * @param {string} categoryName - Nom de la catégorie
 * @returns {Promise<string|null>} - ID de la catégorie ou null
 */
async function findOrCreateCategory(categoryName) {
  if (!categoryName || typeof categoryName !== 'string') {
    return null;
  }

  const trimmedName = categoryName.trim();
  if (!trimmedName) {
    return null;
  }

  try {
    // Chercher une catégorie existante (insensible à la casse)
    let categorie = await Categorie.findOne({ 
      nom: { $regex: new RegExp(`^${trimmedName}$`, 'i') } 
    });

    // Si elle n'existe pas, la créer
    if (!categorie) {
      // Trouver le prochain ordre disponible
      const maxOrdre = await Categorie.findOne({}, {}, { sort: { ordre: -1 } });
      const nextOrdre = maxOrdre ? maxOrdre.ordre + 1 : 1;

      categorie = new Categorie({
        nom: trimmedName,
        description: `Catégorie créée automatiquement lors de l'import GeoJSON`,
        image: {
          type: 'predefined',
          filename: 'default-marker.svg' // Icône par défaut
        },
        couleur: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'), // Couleur aléatoire
        ordre: nextOrdre,
        active: true
      });

      await categorie.save();
    }

    return categorie._id;
  } catch (error) {
    console.error('Erreur lors de la création/recherche de catégorie:', error);
    return null;
  }
}

/**
 * Importe des marqueurs à partir d'un fichier GeoJSON
 * 
 * @param {import('express').Request} req - req.body contient les données GeoJSON
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
exports.importGeoJSON = async (req, res, next) => {
  try {
    const geoJsonData = req.body;
    
    // Validation du format GeoJSON
    if (!geoJsonData || !geoJsonData.type) {
      return res.status(400).json(formatErrorResponse(
        400,
        "Bad Request",
        "Format GeoJSON invalide : le champ 'type' est requis.",
        req.originalUrl
      ));
    }

    let features = [];
    
    if (geoJsonData.type === 'FeatureCollection') {
      if (!geoJsonData.features || !Array.isArray(geoJsonData.features)) {
        return res.status(400).json(formatErrorResponse(
          400,
          "Bad Request",
          "Format GeoJSON invalide : 'features' doit être un tableau.",
          req.originalUrl
        ));
      }
      features = geoJsonData.features;
    } else if (geoJsonData.type === 'Feature') {
      features = [geoJsonData];
    } else {
      return res.status(400).json(formatErrorResponse(
        400,
        "Bad Request",
        "Type GeoJSON non supporté. Seuls 'Feature' et 'FeatureCollection' sont acceptés.",
        req.originalUrl
      ));
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [],
      categoriesCreated: []
    };

    // Traiter chaque feature
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      
      try {
        // Valider la structure de base
        if (!feature.type || feature.type !== 'Feature') {
          results.errors.push(`Feature ${i}: Type invalide (attendu: 'Feature')`);
          results.skipped++;
          continue;
        }

        if (!feature.geometry || !feature.properties) {
          results.errors.push(`Feature ${i}: Géométrie ou propriétés manquantes`);
          results.skipped++;
          continue;
        }

        // Valider la géométrie (Point requis)
        if (feature.geometry.type !== 'Point' || !feature.geometry.coordinates) {
          results.errors.push(`Feature ${i}: Géométrie invalide (Point attendu avec coordonnées)`);
          results.skipped++;
          continue;
        }

        const [lng, lat] = feature.geometry.coordinates;
        
        // Valider les coordonnées
        if (typeof lat !== 'number' || typeof lng !== 'number' ||
            lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          results.errors.push(`Feature ${i}: Coordonnées invalides (lat: ${lat}, lng: ${lng})`);
          results.skipped++;
          continue;
        }

        // Extraire les propriétés avec des valeurs par défaut
        const props = feature.properties;
        const titre = props.titre || props.name || props.title || `Marqueur importé ${i + 1}`;
        const description = props.description || props.desc || '';
        
        // Gérer la catégorie
        let categorieId = null;
        const categoryName = props.type || props.categorie || props.category;
        
        if (categoryName) {
          categorieId = await findOrCreateCategory(categoryName);
          if (categorieId && !results.categoriesCreated.includes(categoryName)) {
            // Vérifier si c'est une nouvelle catégorie
            const existingCategory = await Categorie.findById(categorieId);
            if (existingCategory && existingCategory.description.includes('créée automatiquement')) {
              results.categoriesCreated.push(categoryName);
            }
          }
        }
        
        // Créer le marqueur
        const nouveauMarqueur = new Marqueur({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lat, lng] // Format interne : [lat, lng]
          },
          properties: {
            titre: titre.substring(0, 140), // Limite de 140 caractères
            description: description.substring(0, 1000), // Limite de 1000 caractères
            adresse: props.adresse || props.address || '',
            temoignage: props.temoignage || props.story || '',
            courriel: props.courriel || props.email || '',
            categorie: categorieId,
            images: [],
            status: "approved", // Marqueurs importés approuvés par défaut
            createdByName: "Import GeoJSON",
            tags: props.tags || []
          }
        });

        await nouveauMarqueur.save();
        results.imported++;

      } catch (error) {
        results.errors.push(`Feature ${i}: Erreur lors de la sauvegarde - ${error.message}`);
        results.skipped++;
      }
    }

    // Réponse avec le résumé de l'importation
    let message = `Import terminé : ${results.imported} marqueurs importés, ${results.skipped} ignorés.`;
    if (results.categoriesCreated.length > 0) {
      message += ` ${results.categoriesCreated.length} nouvelles catégories créées : ${results.categoriesCreated.join(', ')}.`;
    }
    
    res.status(200).json(formatSuccessResponse(
      200,
      message,
      results,
      req.originalUrl
    ));

  } catch (err) {
    next(err);
  }
};
