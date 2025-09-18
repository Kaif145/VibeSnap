// routes/upload.js - Upload route definitions
const express = require("express");
const upload = require("../middleware/upload");
const { validateFileUpload } = require("../middleware/validation");
const UploadController = require("../controllers/uploadController");

const router = express.Router();

// Main upload endpoint
router.post("/upload", 
  upload.single("photo"),
  validateFileUpload,
  UploadController.handlePhotoUpload
);

// Bulk upload endpoint (future feature)
router.post("/upload/bulk",
  upload.array("photos", 10),
  UploadController.handleBulkUpload
);

module.exports = router;