"use strict";

const express = require("express");
const router = express.Router();

const marqueurController = require("../controllers/marqueurController");
const editRequestController = require("../controllers/editRequestController");

const isAuth = require("../middlewares/isAuth");
const optionalAuth = require("../middlewares/optionalAuth");

// POST => /marqueurs
router.post("/marqueurs", optionalAuth, marqueurController.createMarqueur);

// GET => /marqueurs 
router.get("/marqueurs", marqueurController.getMarqueurs);

// GET => /marqueurs/:marqueurId
router.get("/marqueurs/:marqueurId", marqueurController.getMarqueur);

// PUT => /marqueurs/:marqueurId
router.put("/marqueurs/:marqueurId", isAuth, marqueurController.updateMarqueur);

// PUT => /marqueurs/:marqueurId/status
router.put("/marqueurs/:marqueurId/status", isAuth, marqueurController.updateStatusMarqueur);

// POST => /marqueurs/:marqueurId/commentaires
router.post("/marqueurs/:marqueurId/commentaires", marqueurController.addCommentMarqueur);

// GET => /commentaires/pending
router.get("/commentaires/pending", isAuth, marqueurController.getPendingComments);

// PATCH => /marqueurs/:marqueurId/commentaires/:commentId/status
router.patch("/marqueurs/:marqueurId/commentaires/:commentId/status", isAuth, marqueurController.updateCommentStatus);

// DELETE => /marqueurs/:marqueurId/commentaires/:commentId
router.delete(
  "/marqueurs/:marqueurId/commentaires/:commentId",
  marqueurController.deleteCommentMarqueur
);

/* ----------------------------------------------------
      🔥 ARCHIVAGE / RESTAURATION / SUPPRESSION FINALE
----------------------------------------------------- */

// ARCHIVER un marqueur (suppression logique)
router.put(
  "/marqueurs/:marqueurId/archive",
  isAuth,
  marqueurController.deleteMarqueur
);

// RESTAURER un marqueur archivé
router.put(
  "/marqueurs/:marqueurId/restore",
  isAuth,
  marqueurController.restoreMarqueur
);

// SUPPRESSION DÉFINITIVE
router.delete(
  "/marqueurs/:marqueurId/permanent",
  isAuth,
  marqueurController.deleteMarqueurPermanently
);

// GET => liste des marqueurs archivés  
router.get(
  "/marqueurs-archives",
  isAuth,
  marqueurController.getArchivedMarqueurs
);

/* ---------------------------------------------------- */

// POST => /marqueurs/:marqueurId/edit-requests
router.post(
  "/marqueurs/:marqueurId/edit-requests",
  optionalAuth,
  editRequestController.createEditRequest
);

module.exports = router;