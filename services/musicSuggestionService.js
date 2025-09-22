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

🎯 CRITICAL: For each song, suggest the PERFECT 15-30 second clip that matches this photo:
- Opening hook (0:00-0:30) for immediate impact
- First chorus (usually 0:45-1:15) for catchiness  
- Bridge section (usually 2:00-2:30) for emotional moments
- Final chorus (usually 2:30-3:00) for big energy

RESPONSE FORMAT - Return ONLY valid JSON, no markdown, no explanations, no extra text:

[
  {
    "title": "Song Title",
    "artist": "Artist Name", 
    "mood": "specific mood",
    "reason": "Why this matches the photo",
    "genre": "genre",
    "best_clip": {
      "start_time": "1:23",
      "end_time": "1:38", 
      "duration": "15 seconds",
      "section": "chorus",
      "why_perfect": "Why this clip is perfect"
    }
  }
]

CRITICAL: Start your response with [ and end with ]. Do not include any text before or after the JSON array.`;
  }

  static parseResponse(response) {
    console.log('Raw response to parse:', response.substring(0, 200) + '...');
    
    try {
      // First try direct JSON parse
      return JSON.parse(response);
    } catch (firstError) {
      console.log('Direct parse failed, trying to clean trailing commas...');
      
      try {
        // Clean the response - remove trailing commas and markdown
        let cleanedResponse = response
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas before } or ]
          .trim();
        
        console.log('Cleaned response:', cleanedResponse.substring(0, 200) + '...');
        return JSON.parse(cleanedResponse);
        
      } catch (secondError) {
        console.log('Cleaned parse failed, trying regex extraction...');
        
        try {
          // Look for JSON array in the text
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            let extractedJson = jsonMatch[0]
              .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
            
            console.log('Extracted JSON:', extractedJson.substring(0, 200) + '...');
            return JSON.parse(extractedJson);
          }
        } catch (thirdError) {
          console.log('Regex extraction failed, trying manual fix...');
          
          try {
            // More aggressive comma cleaning
            let manualClean = response
              .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
              .replace(/,\s*,/g, ',') // Remove double commas
              .replace(/\n/g, ' ') // Remove newlines
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim();
            
            // Extract just the array part
            const arrayMatch = manualClean.match(/\[.*\]/);
            if (arrayMatch) {
              console.log('Manual clean attempt:', arrayMatch[0].substring(0, 200) + '...');
              return JSON.parse(arrayMatch[0]);
            }
            
          } catch (manualError) {
            console.error('All parsing attempts failed');
            console.error('Original response:', response);
          }
        }
      }
    }
    
    // If all parsing fails, throw the error
    throw new Error('Could not parse JSON response after multiple attempts');
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
    
    // Add enhanced fallbacks with clip suggestions
    const enhancedFallbacks = {
      chill: [
        {
          "title": "Good Days",
          "artist": "SZA",
          "mood": "chill",
          "reason": "Perfect for relaxed, cozy vibes with warm atmosphere",
          "genre": "R&B",
          "best_clip": {
            "start_time": "1:05",
            "end_time": "1:25", 
            "duration": "20 seconds",
            "section": "chorus",
            "why_perfect": "The chorus perfectly captures the relaxed, confident energy of your photo"
          }
        }
      ],
      energetic: [
        {
          "title": "Levitating",
          "artist": "Dua Lipa", 
          "mood": "energetic",
          "reason": "High energy matches the vibrant, dynamic atmosphere",
          "genre": "pop",
          "best_clip": {
            "start_time": "1:12",
            "end_time": "1:27",
            "duration": "15 seconds",
            "section": "chorus", 
            "why_perfect": "The main chorus has explosive energy that perfectly matches your vibrant photo"
          }
        }
      ],
      default: [
        {
          "title": "As It Was",
          "artist": "Harry Styles",
          "mood": "nostalgic",
          "reason": "Versatile song that works with most Instagram aesthetics",
          "genre": "pop",
          "best_clip": {
            "start_time": "1:15",
            "end_time": "1:30",
            "duration": "15 seconds",
            "section": "chorus",
            "why_perfect": "The emotional chorus section creates perfect nostalgic connection with your photo"
          }
        },
        {
          "title": "Anti-Hero",
          "artist": "Taylor Swift",
          "mood": "relatable",
          "reason": "Popular choice for authentic, personal Instagram posts", 
          "genre": "pop",
          "best_clip": {
            "start_time": "0:55",
            "end_time": "1:10",
            "duration": "15 seconds",
            "section": "pre-chorus",
            "why_perfect": "This section has the perfect relatable, authentic energy for your personal photo"
          }
        }
      ]
    };
    
    if (desc.includes('chill') || desc.includes('cozy') || desc.includes('relaxed')) {
      return enhancedFallbacks.chill;
    } else if (desc.includes('energetic') || desc.includes('vibrant') || desc.includes('bright')) {
      return enhancedFallbacks.energetic;
    } else if (desc.includes('outdoor') || desc.includes('nature') || desc.includes('beach')) {
      return FALLBACK_SONGS.outdoor;
    }
    
    return enhancedFallbacks.default;
  }
}

module.exports = MusicSuggestionService;