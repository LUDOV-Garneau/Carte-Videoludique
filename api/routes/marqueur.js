"use strict";

const express = require("express");
const router = express.Router();

const marqueurController = require("../controllers/marqueurController");
const editRequestController = require("../controllers/editRequestController");

const isAuth = require("../middlewares/isAuth");
const optionalAuth = require("../middlewares/optionalAuth");

// ---------------------------------------
// ⚠️ IMPORTANT : les routes FIXES AVANT
// ---------------------------------------

// 🔥 Récupérer les marqueurs archivés
router.get("/marqueurs/archives", isAuth, marqueurController.getArchivedMarqueurs);

// ---------------------------------------
// ROUTES CRUD CLASSIQUES
// ---------------------------------------

router.post("/marqueurs", optionalAuth, marqueurController.createMarqueur);

router.get("/marqueurs", marqueurController.getMarqueurs);

router.get("/marqueurs/:marqueurId", marqueurController.getMarqueur);

router.put("/marqueurs/:marqueurId", isAuth, marqueurController.updateMarqueur);

router.put("/marqueurs/:marqueurId/status", isAuth, marqueurController.updateStatusMarqueur);

// ---------------------------------------
// COMMENTAIRES
// ---------------------------------------

router.post("/marqueurs/:marqueurId/commentaires", marqueurController.addCommentMarqueur);

router.get("/commentaires/pending", isAuth, marqueurController.getPendingComments);

router.patch(
  "/marqueurs/:marqueurId/commentaires/:commentId/status",
  isAuth,
  marqueurController.updateCommentStatus
);

router.delete(
  "/marqueurs/:marqueurId/commentaires/:commentId",
  marqueurController.deleteCommentMarqueur
);

// ---------------------------------------
// ARCHIVAGE — DOIT ÊTRE APRÈS LES ROUTES FIXES
// ---------------------------------------

router.put("/marqueurs/:marqueurId/archive", isAuth, marqueurController.deleteMarqueur);

router.put("/marqueurs/:marqueurId/restore", isAuth, marqueurController.restoreMarqueur);

router.delete(
  "/marqueurs/:marqueurId/permanent",
  isAuth,
  marqueurController.deleteMarqueurPermanently
);

// ---------------------------------------
// EDIT REQUESTS
// ---------------------------------------

router.post(
  "/marqueurs/:marqueurId/edit-requests",
  optionalAuth,
  editRequestController.createEditRequest
);

module.exports = router;