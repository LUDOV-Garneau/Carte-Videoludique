"use strict";

const express = require("express");
const router = express.Router();
const cloudinaryController = require("../controllers/cloudinaryController");

router.post("/upload-signature", cloudinaryController.createUploadSignature);

module.exports = router;