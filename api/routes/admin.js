"use strict";

const express = require("express");

const router = express.Router();

const adminController = require("../controllers/adminController");

const isAuth = require("../middlewares/isAuth");



// POST => /signup
router.post("/signup",isAuth, adminController.signup);

// POST => /login
router.post("/login", adminController.login);

// GET => /admins
router.get("/admins",isAuth, adminController.getAdmins); 

// GET => /admins/:adminId
router.get("/admins/:adminId",isAuth, adminController.getAdmin); 


module.exports = router;