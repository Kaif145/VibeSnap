// middleware/errorHandler.js - Global error handling
const fs = require("fs");

const errorHandler = (error, req, res, next) => {
  console.error('❌ Error occurred:', error);

  // Clean up uploaded file if error occurs
  if (req.file && fs.existsSync(req.file.path)) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.warn('Could not delete temp file:', err);
    });
  }

  // Handle specific error types
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: "File too large. Maximum size is 5MB.",
      code: "FILE_TOO_LARGE"
    });
  }

  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: "INVALID_FILE_TYPE"
    });
  }

  if (error.message && error.message.includes('rate limit')) {
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please wait a moment and try again.",
      code: "RATE_LIMIT"
    });
  }

  if (error.message && error.message.includes('network')) {
    return res.status(503).json({
      success: false,
      error: "Service temporarily unavailable. Please try again.",
      code: "NETWORK_ERROR"
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? "Something went wrong. Please try again." 
      : error.message,
    code: "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = errorHandler;