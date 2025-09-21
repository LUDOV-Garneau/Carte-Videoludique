"use strict";

const express = require("express");

const router = express.Router();

const adminController = require("../controllers/adminController");


// GET => /admins/:adminId
router.get("/admins/:adminId", adminController.getAdmin);

// GET => /admins/:admin
router.get("/admins", adminController.getAdmins);


module.exports = router;