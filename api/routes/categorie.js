"use strict";

const express = require("express");

const router = express.Router();

const categorieController = require("../controllers/categorieController");

const isAuth = require("../middlewares/isAuth");

// POST => /categories
router.post("/categories", isAuth, categorieController.createCategorie);

// GET => /categories
router.get("/categories", categorieController.getCategories);

// GET => /categories/:categorieId
router.get("/categories/:categorieId", categorieController.getCategorie);

// PUT => /categories/:categorieId
router.put("/categories/:categorieId", isAuth, categorieController.updateCategorie);

// PATCH => /categories/:categorieId/ordre
router.patch("/categories/:categorieId/ordre", isAuth, categorieController.updateCategorieOrdre);

// DELETE => /categories/:categorieId
router.delete("/categories/:categorieId", isAuth, categorieController.deleteCategorie);

module.exports = router;