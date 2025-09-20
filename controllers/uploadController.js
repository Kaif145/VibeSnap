// controllers/uploadController.js - Handle upload requests with analytics
const fs = require("fs");
const ImageAnalysisService = require("../services/imageAnalysisService");
const MusicSuggestionService = require("../services/musicSuggestionService");
const AnalyticsService = require("../services/analyticsService");

class UploadController {
  static async handlePhotoUpload(req, res, next) {
    const startTime = Date.now();
    
    try {
      const { file, body: { preference } } = req;
      
      console.log(`📸 Processing: ${file.originalname} (${file.mimetype})`);

      // Convert uploaded file to base64 for display
      const imageBuffer = fs.readFileSync(file.path);
      const base64Image = `data:${file.mimetype};base64,${imageBuffer.toString('base64')}`;

      // Step 1: Analyze the image
      const description = await ImageAnalysisService.analyzeImage(file.path, file.mimetype);
      console.log(`🔍 Analysis complete: ${description.slice(0, 100)}...`);

      // Step 2: Get song suggestions with Spotify links
      const suggestions = await MusicSuggestionService.getSuggestionsWithLinks(description, preference);
      console.log(`🎵 Generated ${suggestions.length} suggestions with Spotify links`);

      // Step 3: Track analytics (anonymous data only)
      AnalyticsService.trackPhotoUpload(description, preference, 'mixed');

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
        uploadedPhoto: base64Image, // Add base64 image for display
        metadata: {
          totalSongs: suggestions.length,
          processingTime,
          preference: preference || "no preference",
          imageAnalyzed: true,
          timestamp: new Date().toISOString(),
          fileName: file.originalname
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