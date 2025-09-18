// controllers/healthController.js - Health check endpoints
const fs = require("fs");
const path = require("path");

class HealthController {
  static getHealth(req, res) {
    const uptime = process.uptime();
    const uploadsDir = path.join(__dirname, "../uploads");
    
    res.json({
      status: "OK",
      message: "VibeSnap is running smoothly! 🎵",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)} minutes`,
      environment: process.env.NODE_ENV || 'development',
      version: "1.0.0",
      services: {
        imageAnalysis: "✅ Ready",
        musicSuggestion: "✅ Ready", 
        spotify: process.env.SPOTIFY_CLIENT_ID ? "✅ Connected" : "⚠️ Fallback mode",
        storage: fs.existsSync(uploadsDir) ? "✅ Available" : "❌ Not found"
      }
    });
  }

  static getStats(req, res) {
    const memUsage = process.memoryUsage();
    
    res.json({
      status: "OK",
      stats: {
        memory: {
          used: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`
        },
        uptime: {
          seconds: Math.floor(process.uptime()),
          formatted: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`
        },
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  }
}

module.exports = HealthController;