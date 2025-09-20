// server.js - Main entry point (CORRECTED)
const dotenv = require("dotenv");

// MUST be first - load environment variables
dotenv.config();

// Debug: Check if API key is loaded
console.log('🔑 API Key loaded:', process.env.OPENROUTER_API_KEY ? 'YES' : 'NO');
console.log('🔑 Key length:', process.env.OPENROUTER_API_KEY?.length || 'undefined');

const express = require("express");
const path = require("path");
const fs = require("fs");

// Import routes
const uploadRoutes = require("./routes/upload");
const healthRoutes = require("./routes/health");
// const notesRoutes = require("./routes/notes");
const analyticsRoutes = require("./routes/analytics");

// Import middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api", uploadRoutes);
app.use("/api", healthRoutes);
// app.use("/api", notesRoutes);
app.use("/api", analyticsRoutes);

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 VibeSnap running at http://localhost:${PORT}`);
  console.log(`📁 Upload photos at http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});