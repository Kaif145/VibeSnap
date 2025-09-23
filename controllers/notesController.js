// controllers/notesController.js - Handle Instagram Notes requests
const NotesService = require("../services/notesService");
const Helpers = require("../utils/helpers");

class NotesController {
  static async getMoodBasedSongs(req, res, next) {
    try {
      const { mood, language } = req.body;
      
      console.log(`🎵 Notes request - Mood: ${mood}, Language: ${language || 'mixed'}`);

      const suggestions = await NotesService.getSongsForMood(mood, language);
      
      console.log(`✅ Generated ${suggestions.length} note songs for mood: ${mood}`);

      res.json(Helpers.createResponse(true, {
        suggestions,
        mood,
        language: language || 'mixed',
        type: 'mood-based'
      }, null, {
        totalSongs: suggestions.length,
        suggestedFor: 'instagram-notes'
      }));

    } catch (error) {
      console.error('Notes mood controller error:', error);
      next(error);
    }
  }

  static async getStorySongs(req, res, next) {
    try {
      const { story, language } = req.body;
      
      console.log(`📖 Story request - Story: ${story}, Language: ${language || 'mixed'}`);

      const suggestions = await NotesService.getSongsForStory(story, language);
      
      console.log(`✅ Generated ${suggestions.length} story songs`);

      res.json(Helpers.createResponse(true, {
        suggestions,
        story,
        language: language || 'mixed',
        type: 'story-based'
      }, null, {
        totalSongs: suggestions.length,
        suggestedFor: 'instagram-story'
      }));

    } catch (error) {
      console.error('Story controller error:', error);
      next(error);
    }
  }

  static async getTrendingSongs(req, res, next) {
    try {
      const { language } = req.query;
      
      console.log(`📈 Trending notes request - Language: ${language || 'mixed'}`);

      const suggestions = await NotesService.getTrendingNoteSongs(language);
      
      console.log(`✅ Generated ${suggestions.length} trending note songs`);

      res.json(Helpers.createResponse(true, {
        suggestions,
        language: language || 'mixed',
        type: 'trending'
      }, null, {
        totalSongs: suggestions.length,
        suggestedFor: 'instagram-notes',
        trending: true
      }));

    } catch (error) {
      console.error('Notes trending controller error:', error);
      next(error);
    }
  }
}

module.exports = NotesController;