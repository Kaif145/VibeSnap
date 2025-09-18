// routes/health.js - Health check route definitions
const express = require("express");
const { validateHealthCheck } = require("../middleware/validation");
const HealthController = require("../controllers/healthController");

const router = express.Router();

// Basic health check
router.get("/health", 
  validateHealthCheck,
  HealthController.getHealth
);

// Detailed stats
router.get("/stats",
  validateHealthCheck, 
  HealthController.getStats
);

module.exports = router;