// controllers/uploadController.js - Handle upload requests
const fs = require("fs");
const ImageAnalysisService = require("../services/imageAnalysisService");
const MusicSuggestionService = require("../services/musicSuggestionService");

class UploadController {
  static async handlePhotoUpload(req, res, next) {
    const startTime = Date.now();
    
    try {
      const { file, body: { preference } } = req;
      
      console.log(`📸 Processing: ${file.originalname} (${file.mimetype})`);

      // Step 1: Analyze the image
      const description = await ImageAnalysisService.analyzeImage(file.path, file.mimetype);
      console.log(`🔍 Analysis complete: ${description.slice(0, 100)}...`);

      // Step 2: Get song suggestions with Spotify links
      const suggestions = await MusicSuggestionService.getSuggestionsWithLinks(description, preference);
      console.log(`🎵 Generated ${suggestions.length} suggestions with Spotify links`);

      // Clean up uploaded file
      fs.unlink(file.path, (err) => {
        if (err) console.warn('Could not delete temp file:', err);
      });

      const processingTime = Date.now() - startTime;
      console.log(`✅ Request completed in ${processingTime}ms`);

      res.json({
        success: true,
        description,
        suggestions,
        metadata: {
          totalSongs: suggestions.length,
          processingTime,
          preference: preference || "no preference",
          imageAnalyzed: true,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Upload controller error:', error);
      
      // Pass error to error handling middleware
      next(error);
    }
  }

  static async handleBulkUpload(req, res, next) {
    // Future feature for multiple photos
    res.status(501).json({
      success: false,
      error: "Bulk upload feature coming soon!",
      code: "NOT_IMPLEMENTED"
    });
  }
}

module.exports = UploadController;