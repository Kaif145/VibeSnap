// controllers/storiesController.js - Handle Instagram Stories requests
const StoriesService = require("../services/storiesService");
const Helpers = require("../utils/helpers");

class StoriesController {
  static async getMoodBasedSongs(req, res, next) {
    try {
      const { mood, language, contentType } = req.body;
      
      console.log(`🎬 Stories request - Mood: ${mood}, Language: ${language || 'mixed'}, ContentType: ${contentType || 'stories'}`);

      const suggestions = await StoriesService.getSongsForMood(mood, language, contentType);
      
      console.log(`✅ Generated ${suggestions.length} story songs for mood: ${mood}`);

      res.json(Helpers.createResponse(true, {
        suggestions,
        mood,
        language: language || 'mixed',
        contentType: contentType || 'stories',
        type: 'mood-based'
      }, null, {
        totalSongs: suggestions.length,
        suggestedFor: 'instagram-stories'
      }));

    } catch (error) {
      console.error('Stories mood controller error:', error);
      next(error);
    }
  }

  static async getTrendingSongs(req, res, next) {
    try {
      const { language, contentType } = req.query;
      
      console.log(`📈 Trending stories request - Language: ${language || 'mixed'}, ContentType: ${contentType || 'stories'}`);

      const suggestions = await StoriesService.getTrendingStorySongs(language, contentType);
      
      console.log(`✅ Generated ${suggestions.length} trending story songs`);

      res.json(Helpers.createResponse(true, {
        suggestions,
        language: language || 'mixed',
        contentType: contentType || 'stories',
        type: 'trending'
      }, null, {
        totalSongs: suggestions.length,
        suggestedFor: 'instagram-stories',
        trending: true
      }));

    } catch (error) {
      console.error('Stories trending controller error:', error);
      next(error);
    }
  }
}

module.exports = StoriesController;

