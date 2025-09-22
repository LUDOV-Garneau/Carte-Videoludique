"use strict";

const express = require("express");

const seedController = require("../controllers/dbController");

const router = express.Router();

router.get("/db/seed", (req, res, next) => {
    console.log("Route atteinte !");
    next();
},seedController.seed );

module.exports = router;