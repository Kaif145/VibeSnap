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


// Add to your routes/health.js
router.get("/api-usage", async (req, res) => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    });
    
    const data = await response.json();
    res.json({
      usage: data.usage,
      limit: data.limit,
      remaining: data.limit - data.usage
    });
  } catch (error) {
    res.json({ error: 'Could not fetch usage data' });
  }
});



module.exports = router;