const express = require("express");

const router = express.Router();
const editRequestController = require("../controllers/editRequestController");
const isAuth = require("../middlewares/isAuth");
const optionalAuth = require("../middlewares/optionalAuth");

// POST => /marqueurs/:id/edit-requests
router.post("/marqueurs/:id/edit-requests", optionalAuth, editRequestController.createEditRequest);

// GET => /edit-requests
router.get("/edit-requests", isAuth, editRequestController.getEditRequests);

// PUT => /edit-requests/:editRequestId/approve
router.put("/edit-requests/:editRequestId/approve", isAuth, editRequestController.approveEditRequest);

// PUT => /edit-requests/:editRequestId/reject
router.put("/edit-requests/:editRequestId/reject", isAuth, editRequestController.rejectEditRequest);

module.exports = router;