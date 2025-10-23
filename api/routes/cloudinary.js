"use strict";

const express = require("express");
const router = express.Router();
const cloudinaryController = require("../controllers/cloudinaryController");

router.get("/upload-signature", cloudinaryController.createUploadSignature);

router.post("/cleanup-images", cloudinaryController.cleanupImages);

module.exports = router;