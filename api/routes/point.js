"use strict";

const express = require("express");

const router = express.Router();

const carteController = require("../controllers/carteController");

const isAuth = require("../middleware/isAuth");


// POST => /cartes
router.post("/cartes", carteController.createCarte);

// GET => /cartes 
router.get("/cartes", carteController.getCartes);

// GET => /cartes/:carteId
router.get("/cartes/:carteId", carteController.getCarte);

// PUT => /cartes/:carteId
router.put("/cartes/:carteId", isAuth, carteController.updateCarte);

// DELETE => /cartes/:carteId
router.delete("/cartes/:carteId", isAuth, carteController.deleteCarte);

module.exports = router;