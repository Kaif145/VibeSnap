// services/musicSuggestionService.js - Music suggestion logic
const client = require("../config/openai");
const SpotifyService = require("./spotifyService");
const { FALLBACK_SONGS } = require("../utils/constants");

class MusicSuggestionService {
  static async getSuggestionsWithLinks(description, preference = "") {
    try {
      const prompt = this.buildPrompt(description, preference);
      
      const completion = await client.chat.completions.create({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.8
      });

      const response = completion.choices[0].message.content.trim();
      console.log('🎵 Music suggestion response received');
      
      // Parse JSON response
      let suggestions = this.parseResponse(response);
      
      // Add Spotify links
      suggestions = await this.addSpotifyLinks(suggestions);
      
      return suggestions;

    } catch (error) {
      console.error('Music suggestion error:', error);
      return this.getFallbackSuggestions(description);
    }
  }

  static buildPrompt(description, preference) {
    return `You are an expert music curator for Instagram creators who understand current trends and viral music.

📸 PHOTO ANALYSIS: "${description}"
🎵 USER PREFERENCE: ${preference || "open to all genres"}

Based on this photo's specific mood, energy, and aesthetic, suggest 5 PERFECT songs for Instagram that will:
✅ Match the exact vibe and energy level
✅ Be popular/trending for good engagement  
✅ Fit the Instagram aesthetic shown
✅ Appeal to the target demographic

IMPORTANT: Consider the specific details in the photo analysis - if it mentions "cozy vibes" suggest chill songs, if "energetic atmosphere" suggest upbeat tracks, etc.

Return ONLY this JSON format:
[
  {
    "title": "Exact Song Title",
    "artist": "Artist Name", 
    "mood": "specific mood that matches photo",
    "reason": "Explain WHY this song perfectly matches the photo's specific elements",
    "genre": "genre"
  }
]

Focus on current popular songs that Instagram users actually use. No extra text, just valid JSON.`;
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
        console.warn('Could not parse music suggestion response');
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

  static getFallbackSuggestions(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('chill') || desc.includes('cozy') || desc.includes('relaxed')) {
      return FALLBACK_SONGS.chill;
    } else if (desc.includes('energetic') || desc.includes('vibrant') || desc.includes('bright')) {
      return FALLBACK_SONGS.energetic;
    } else if (desc.includes('outdoor') || desc.includes('nature') || desc.includes('beach')) {
      return FALLBACK_SONGS.outdoor;
    }
    
    return FALLBACK_SONGS.default;
  }
}

module.exports = MusicSuggestionService;