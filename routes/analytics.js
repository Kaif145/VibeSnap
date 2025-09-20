// routes/analytics.js - Analytics route definitions
const express = require("express");
const AnalyticsController = require("../controllers/analyticsController");

const router = express.Router();

// Get analytics data (JSON)
router.get("/analytics", AnalyticsController.getAnalytics);

// Get analytics dashboard (HTML page)
router.get("/dashboard", AnalyticsController.getDashboard);

module.exports = router;