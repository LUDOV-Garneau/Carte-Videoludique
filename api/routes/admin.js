"use strict";

const express = require("express");

const router = express.Router();

const adminController = require("../controllers/adminController");


// GET => /admins/:adminId
router.get("/admins/:adminId", adminController.getAdmin); //À Faire

// GET => /admins
router.get("/admins", adminController.getAdmins); //À Faire

// POST => /signup
router.post("/signup", adminController.signup);

// POST => /login
router.post("/login", adminController.login);


module.exports = router;