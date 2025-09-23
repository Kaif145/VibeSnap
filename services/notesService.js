// services/notesService.js - Instagram Notes logic
const client = require("../config/openai");
const SpotifyService = require("./spotifyService");
const { NOTES_FALLBACK_SONGS } = require("../utils/constants");

class NotesService {
  static async getSongsForMood(mood, language = 'mixed') {
    try {
      const prompt = this.buildMoodPrompt(mood, language);
      
      const completion = await client.chat.completions.create({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.9 // Higher creativity for diverse suggestions
      });

      const response = completion.choices[0].message.content.trim();
      console.log('🎵 Notes AI response received');
      
      let suggestions = this.parseResponse(response);
      suggestions = await this.addSpotifyLinks(suggestions);
      
      return suggestions;

    } catch (error) {
      console.error('Notes mood service error:', error);
      return this.getFallbackSongs('mood', mood, language);
    }
  }

  static async getTrendingNoteSongs(language = 'mixed') {
    try {
      const prompt = this.buildTrendingPrompt(language);
      
      const completion = await client.chat.completions.create({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7
      });

      const response = completion.choices[0].message.content.trim();
      console.log('📈 Trending notes AI response received');
      
      let suggestions = this.parseResponse(response);
      suggestions = await this.addSpotifyLinks(suggestions);
      
      return suggestions;

    } catch (error) {
      console.error('Notes trending service error:', error);
      return this.getFallbackSongs('trending', null, language);
    }
  }

  static async getSongsForStory(story, language = 'mixed') {
    try {
      const prompt = this.buildStoryPrompt(story, language);
      
      const completion = await client.chat.completions.create({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.8
      });

      const response = completion.choices[0].message.content.trim();
      console.log('📖 Story AI response received');
      
      let suggestions = this.parseResponse(response);
      suggestions = await this.addSpotifyLinks(suggestions);
      
      return suggestions;

    } catch (error) {
      console.error('Story service error:', error);
      return this.getFallbackSongs('story', story, language);
    }
  }

  static buildStoryPrompt(story, language) {
    const languageInstructions = this.getLanguageInstructions(language);
    
    return `You are an expert music curator for Instagram Stories. Instagram Stories need songs that enhance storytelling and create atmosphere.

📖 STORY CONTENT: "${story}"
🌍 LANGUAGE PREFERENCE: ${language}

${languageInstructions}

Suggest 10 PERFECT songs for Instagram Stories that:
✅ Enhance the story/narrative being told
✅ Are currently trending and popular on Instagram
✅ Create the right atmosphere for the story
✅ Are perfect for 15-30 second story clips
✅ Mix of different moods to match story progression

IMPORTANT: 
- Focus on songs that complement storytelling
- Consider the narrative flow and emotional arc
- Instagram Stories are about sharing moments and experiences
- Songs should enhance, not distract from the story

Return ONLY this JSON format:
[
  {
    "title": "Exact Song Title",
    "artist": "Artist Name",
    "mood": "mood this song creates",
    "reason": "Why this song enhances the story being told",
    "genre": "genre",
    "language": "English/Hindi",
    "story_fit": "beginning/middle/climax/ending"
  }
]

No extra text, just valid JSON.`;
  }

  static buildMoodPrompt(mood, language) {
    const languageInstructions = this.getLanguageInstructions(language);
    
    return `You are an expert music curator for Instagram Notes. Instagram Notes are short, personal expressions where people share songs that match their current feelings.

😊 USER MOOD/FEELING: "${mood}"
🌍 LANGUAGE PREFERENCE: ${language}

${languageInstructions}

Suggest 10 PERFECT songs for Instagram Notes that:
✅ Match the exact mood/feeling described
✅ Are currently trending and popular on Instagram
✅ Have emotional connection and relatability
✅ Are perfect for expressing feelings in Notes
✅ Mix of recent hits and timeless favorites

IMPORTANT: 
- Focus on songs people actually use in Instagram Notes
- Consider the emotional impact of each song
- Include songs that help express the feeling, not just match it
- Instagram Notes are about personal expression

Return ONLY this JSON format:
[
  {
    "title": "Exact Song Title",
    "artist": "Artist Name",
    "mood": "specific mood this song conveys",
    "reason": "Why this song perfectly expresses the feeling for Instagram Notes",
    "genre": "genre",
    "language": "English/Hindi",
    "vibe": "chill/energetic/emotional/confident/etc",
    "best_clip": {
      "start_time": "1:15",
      "end_time": "1:30",
      "duration": "15 seconds", 
      "section": "chorus/hook/verse",
      "why_perfect": "Why this exact clip is perfect for Instagram Notes with this mood"
    }
  }
]

No extra text, just valid JSON.`;
  }

  static buildTrendingPrompt(language) {
    const languageInstructions = this.getLanguageInstructions(language);
    
    return `You are a music trend expert specializing in Instagram Notes. People use Notes to share what they're currently listening to or feeling.

📈 REQUEST: Current trending songs perfect for Instagram Notes
🌍 LANGUAGE: ${language}

${languageInstructions}

Suggest 10 HOTTEST trending songs that are:
✅ Currently viral on Instagram Notes
✅ Getting high engagement when shared
✅ Mix of different moods (happy, sad, confident, chill)
✅ Popular across different age groups
✅ Perfect for expressing current vibes

Focus on songs that are:
- Trending THIS month on social media
- Getting lots of reposts in Instagram Notes
- Have that "everyone is using this" factor
- Mix of established hits and rising songs

Return ONLY this JSON format:
[
  {
    "title": "Song Title",
    "artist": "Artist Name", 
    "mood": "mood this song expresses",
    "reason": "Why this song is trending in Instagram Notes",
    "genre": "genre",
    "language": "English/Hindi",
    "trend_factor": "viral/rising/established"
  }
]

No extra text, just valid JSON.`;
  }

  static buildMixedLanguagePrompt(mood, includeHindi) {
    const hindiInstructions = includeHindi 
      ? "Include 4-5 Hindi/Bollywood songs and 5-6 English songs. Make sure Hindi songs are current and popular."
      : "Focus only on English songs, but include diverse international artists.";
    
    return `You are a bilingual music curator for Instagram Notes, specializing in both English and Hindi music.

😊 USER MOOD: "${mood}"
🌍 LANGUAGE MIX: ${includeHindi ? 'English + Hindi' : 'English Only'}

${hindiInstructions}

Create a perfect mix that:
✅ Matches the exact mood in both languages
✅ Includes current trending songs from both markets
✅ Balances different sub-moods within the main feeling
✅ Appeals to multilingual Instagram users
✅ Has variety in artists and styles

For Hindi songs: Include current Bollywood hits, indie Hindi artists, and popular regional songs
For English songs: Mix international hits with trending tracks

Return ONLY this JSON format:
[
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "mood": "specific mood conveyed", 
    "reason": "Why perfect for this feeling in Instagram Notes",
    "genre": "genre",
    "language": "English/Hindi",
    "market": "international/bollywood/indie"
  }
]

Ensure good balance between languages. No extra text, just valid JSON.`;
  }

  static getLanguageInstructions(language) {
    switch(language) {
      case 'hindi':
        return "🇮🇳 Focus ONLY on Hindi songs: Bollywood hits, indie Hindi artists, regional favorites. Include both classic and contemporary Hindi music.";
      case 'english':
        return "🌍 Focus ONLY on English songs: International hits, trending tracks, mix of established and emerging artists.";
      case 'mixed':
      default:
        return "🌏 Mix both English and Hindi songs (5 English + 5 Hindi). Balance international appeal with Indian market preferences.";
    }
  }

  static parseResponse(response) {
    try {
      return JSON.parse(response);
    } catch {
      try {
        const jsonMatch = response.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        console.warn('Could not parse notes response');
      }
      throw new Error('Could not parse JSON response');
    }
  }

  static async addSpotifyLinks(suggestions) {
    return Promise.all(
      suggestions.map(async (song) => {
        const spotifyUrl = await SpotifyService.getSpotifyLink(song.title, song.artist);
        return {
          ...song,
          spotify_url: spotifyUrl
        };
      })
    );
  }

  static getFallbackSongs(type, mood, language) {
    const fallbacks = NOTES_FALLBACK_SONGS[language] || NOTES_FALLBACK_SONGS.mixed;
    
    if (type === 'trending') {
      return fallbacks.trending || fallbacks.default;
    } else if (mood) {
      const moodLower = mood.toLowerCase();
      if (moodLower.includes('happy') || moodLower.includes('excited')) {
        return fallbacks.happy || fallbacks.default;
      } else if (moodLower.includes('sad') || moodLower.includes('missing')) {
        return fallbacks.sad || fallbacks.default;
      } else if (moodLower.includes('confident') || moodLower.includes('motivated')) {
        return fallbacks.confident || fallbacks.default;
      }
    }
    
    return fallbacks.default || fallbacks.trending;
  }
}

module.exports = NotesService;