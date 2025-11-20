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

// DELETE => /marqueurs/:marqueurId/commentaires/commentsId
router.delete("/marqueurs/:marqueurId/commentaires/:commentId", marqueurController.deleteCommentMarqueur);

// DELETE => /marqueurs/:marqueurId
router.delete("/marqueurs/:marqueurId", isAuth, marqueurController.deleteMarqueur);

// POST => /marqueurs/:marqueurId/edit-requests
router.post(
  "/marqueurs/:marqueurId/edit-requests",
  optionalAuth, // ou isAuth si tu veux obliger la connexion
  editRequestController.createEditRequest
);

module.exports = router;