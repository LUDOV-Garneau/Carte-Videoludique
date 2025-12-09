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

// PATCH => /categories/:categorieId/ordre
router.patch("/categories/:categorieId/ordre", isAuth, categorieController.patchCategorieOrdre);

// PATCH => /categories/:categorieId/nom
router.patch("/categories/:categorieId/nom", isAuth, categorieController.patchCategorieNom);

// PATCH => /categories/:categorieId/description
router.patch("/categories/:categorieId/description", isAuth, categorieController.patchCategorieDescription);

// PATCH => /categories/:categorieId/couleur
router.patch("/categories/:categorieId/couleur", isAuth, categorieController.patchCategorieCouleur);

// PATCH => /categories/:categorieId/image
router.patch("/categories/:categorieId/image", isAuth, categorieController.patchCategorieImage);

// PATCH => /categories/:categorieId/active
router.patch("/categories/:categorieId/active", isAuth, categorieController.patchCategorieActive);

module.exports = router;