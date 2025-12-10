"use strict";

const express = require("express");
const router = express.Router();

const marqueurController = require("../controllers/marqueurController");
const editRequestController = require("../controllers/editRequestController");

const isAuth = require("../middlewares/isAuth");
const optionalAuth = require("../middlewares/optionalAuth");


// -------------------------------------------------------
// CRUD + Archive / Restore
// -------------------------------------------------------

// POST => /marqueurs (création - admin optionnel)
router.post("/marqueurs", optionalAuth, marqueurController.createMarqueur);

// GET => /marqueurs (liste des marqueurs NON archivés)
router.get("/marqueurs", marqueurController.getMarqueurs);

// ⚠️ IMPORTANT : route spécifique, placée AVANT /marqueurs/:id
// GET => /marqueurs-archives (liste des archivés)
router.get("/marqueurs-archives", isAuth, marqueurController.getArchivedMarqueurs);

// GET => /marqueurs/:marqueurId (un marqueur)
router.get("/marqueurs/:marqueurId", marqueurController.getMarqueur);

// PUT => /marqueurs/:marqueurId (modification complète)
router.put("/marqueurs/:marqueurId", isAuth, marqueurController.updateMarqueur);

// PUT => /marqueurs/:marqueurId/status (changer statut pending/approved/rejected)
router.put("/marqueurs/:marqueurId/status", isAuth, marqueurController.updateStatusMarqueur);

// DELETE => /marqueurs/:marqueurId (ARCHIVER un marqueur → NE SUPPRIME PLUS)
router.delete("/marqueurs/:marqueurId", isAuth, marqueurController.archiveMarqueur);

// PUT => /marqueurs/:marqueurId/restaurer (désarchive)
router.put("/marqueurs/:marqueurId/restaurer", isAuth, marqueurController.restoreMarqueur);

// DELETE => /marqueurs/:marqueurId/definitif (suppression DÉFINITIVE)
router.delete("/marqueurs/:marqueurId/definitif", isAuth, marqueurController.deleteMarqueurDefinitif);


// -------------------------------------------------------
// Commentaires / Témoignages
// -------------------------------------------------------

// POST => /marqueurs/:marqueurId/commentaires (ajouter un témoignage)
router.post("/marqueurs/:marqueurId/commentaires", marqueurController.addCommentMarqueur);

// GET => /commentaires/pending (liste des témoignages en attente)
router.get("/commentaires/pending", isAuth, marqueurController.getPendingComments);

// PATCH => /marqueurs/:marqueurId/commentaires/:commentId/status (approuver / rejeter)
router.patch(
  "/marqueurs/:marqueurId/commentaires/:commentId/status",
  isAuth,
  marqueurController.updateCommentStatus
);

router.get("/commentaires-archives", isAuth, marqueurController.getArchivedCommentaires);

router.delete("/marqueurs/:marqueurId/commentaires/:commentId/archive", isAuth, marqueurController.archiveCommentaire);

router.put("/marqueurs/:marqueurId/commentaires/:commentId/restaurer", isAuth, marqueurController.restoreCommentaire);

router.delete("/marqueurs/:marqueurId/commentaires/:commentId/definitif", isAuth, marqueurController.deleteCommentaireDefinitif);


// -------------------------------------------------------
// Demandes de modification
// -------------------------------------------------------
router.post(
  "/marqueurs/:marqueurId/edit-requests",
  optionalAuth,
  editRequestController.createEditRequest
);

module.exports = router;
