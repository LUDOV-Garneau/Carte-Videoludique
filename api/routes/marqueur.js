"use strict";

const express = require("express");

const router = express.Router();

const marqueurController = require("../controllers/marqueurController");

const isAuth = require("../middlewares/isAuth");


// POST => /marqueurs
router.post("/marqueurs", marqueurController.createMarqueur);

// GET => /marqueurs 
router.get("/marqueurs", marqueurController.getMarqueurs);

// GET => /marqueurs/:marqueurId
router.get("/marqueurs/:marqueurId", marqueurController.getMarqueur);

// PUT => /marqueurs/:marqueurId
router.put("/marqueurs/:marqueurId", isAuth, marqueurController.updateMarqueur);

// DELETE => /marqueurs/:marqueurId
router.delete("/marqueurs/:marqueurId", isAuth, marqueurController.deleteMarqueur);

module.exports = router;