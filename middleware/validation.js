// middleware/validation.js - Input validation middleware
const fs = require("fs");

const validateFileUpload = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Please select an image.",
        code: "NO_FILE"
      });
    }

    // Validate file exists
    if (!fs.existsSync(req.file.path)) {
      return res.status(400).json({
        success: false,
        error: "File upload failed. Please try again.",
        code: "FILE_NOT_FOUND"
      });
    }

    // Sanitize preference input
    if (req.body.preference) {
      req.body.preference = req.body.preference.trim().slice(0, 100); // Max 100 chars
    }

    next();
  } catch (error) {
    console.error('File validation error:', error);
    res.status(500).json({
      success: false,
      error: "File validation failed",
      code: "VALIDATION_ERROR"
    });
  }
};

const validateHealthCheck = (req, res, next) => {
  // Add any health check validations here
  next();
};

module.exports = {
  validateFileUpload,
  validateHealthCheck
};