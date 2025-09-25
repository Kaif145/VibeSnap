// services/notesService.js - Instagram Notes logic (with "Show more" support)
const client = require("../config/openai");
const SpotifyService = require("./spotifyService");
const { NOTES_FALLBACK_SONGS } = require("../utils/constants");

class NotesService {
  /**
   * Get songs for a given mood, language, and (optionally) previous song titles for pagination.
   * @param {string} mood - User's mood/feeling.
   * @param {string} language - Language preference ('english', 'hindi', 'mixed', etc).
   * @param {Array<string>} prevTitles - Array of already shown song titles (for "Show more").
   * @returns {Promise<Array>} - Array of song suggestion objects.
   */
  static async getSongsForMood(mood, language = 'mixed', prevTitles = []) {
  try {
    const prompt = this.buildMoodPrompt(mood, language, prevTitles);

    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500, // Increased from 1000
      temperature: 0.9
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

  /**
   * Get trending note songs, with language and pagination support.
   * @param {string} language - Language preference.
   * @param {Array<string>} prevTitles - Array of already shown song titles (for "Show more").
   * @returns {Promise<Array>}
   */
  static async getTrendingNoteSongs(language = 'mixed', prevTitles = []) {
    try {
      const prompt = this.buildTrendingPrompt(language, prevTitles);

      const completion = await client.chat.completions.create({
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
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
  };

  /**
   * Build prompt for mood-based song suggestions.
   * @param {string} mood 
   * @param {string} language 
   * @param {Array<string>} prevTitles 
   * @returns {string}
   */
  static buildMoodPrompt(mood, language, prevTitles = []) {
    const languageInstructions = this.getLanguageInstructions(language);
    const prevInstruction = prevTitles.length
      ? `Do NOT repeat these songs: ${prevTitles.join(", ")}. Only suggest new and different songs.`
      : '';
    const songCount = prevTitles.length ? 5 : 10;

    return `You are an expert music curator for Instagram Notes. Instagram Notes are short, personal expressions where people share songs that match their current feelings.

😊 USER MOOD/FEELING: "${mood}"
🌍 LANGUAGE PREFERENCE: ${language}

${languageInstructions}
${prevInstruction}

Suggest ${songCount} ${songCount === 5 ? "MORE " : ""}PERFECT songs for Instagram Notes that:
✅ Match the exact mood/feeling described
✅ Are currently trending and popular on Instagram & TikTok
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
    "language": "Language (e.g. English, Hindi, Punjabi, Bengali, Korean, etc)",
    "market": "international/bollywood/indie/k-pop/regional",
    "lyrics_snippet": "short relevant lyric from the song"
  }
]

No extra text, just valid JSON.`;
  }
  

  /**
   * Build prompt for trending song suggestions.
   * @param {string} language 
   * @param {Array<string>} prevTitles 
   * @returns {string}
   */
  static buildTrendingPrompt(language, prevTitles = []) {
    const languageInstructions = this.getLanguageInstructions(language);
    const prevInstruction = prevTitles.length
      ? `Do NOT repeat these songs: ${prevTitles.join(", ")}. Only suggest new and different songs.`
      : '';
    const songCount = prevTitles.length ? 5 : 10;

    return `You are a music trend expert specializing in Instagram Notes. People use Notes to share what they're currently listening to or feeling.

📈 REQUEST: Current trending songs perfect for Instagram Notes
🌍 LANGUAGE: ${language}

${languageInstructions}
${prevInstruction}

Suggest ${songCount} HOTTEST trending songs that are:
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
    "language": "Language (e.g. English, Hindi, Punjabi, Bengali, Korean, etc)",
    "market": "international/bollywood/indie/k-pop/regional",
    "lyrics_snippet": "short trending lyric"
  }
]

No extra text, just valid JSON.`;
  }

  /**
   * Generate language/market instructions for the AI prompt.
   * @param {string} language 
   * @returns {string}
   */
  static getLanguageInstructions(language) {
    switch(language) {
      case 'hindi':
        return "🇮🇳 Focus ONLY on Hindi songs: Bollywood hits, indie Hindi artists, regional favorites. Include both classic and contemporary Hindi music.";
      case 'english':
        return "🌍 Focus ONLY on English songs: International hits, trending tracks, mix of established and emerging artists.";
      case 'punjabi':
        return "🎤 Focus ONLY on Punjabi songs: Include trending Punjabi pop, Bhangra, and folk hits. Both classics and new releases.";
      case 'bengali':
        return "🎶 Focus ONLY on Bengali songs: Include popular modern Bengali hits, Tollywood, and folk songs.";
      case 'k-pop':
        return "🎵 Focus ONLY on K-pop: Suggest trending K-pop hits, viral TikTok/Instagram tracks, and group/solo favorites.";
      case 'mixed':
      default:
        return `🌏 Give a mix of ALL types of songs, any language, any genre.
- Include trending English, Hindi, Punjabi, Bengali, K-pop, and other regional/international hits.
- Prioritize songs that are popular on Instagram/TikTok Notes, regardless of language.
- Suggest rap, pop, indie, Bollywood, K-pop, regional, and evergreen favorites.
- Ensure diversity: at least 5 languages/markets if possible.`;
    }
  }

 /**
   * Parse AI response JSON with enhanced error handling for truncated responses.
   * @param {string} response 
   * @returns {Array}
   */
  static parseResponse(response) {
    console.log('Raw response to parse:', response.substring(0, 200) + '...');
    console.log('Full response length:', response.length);
    
    try {
      // First try direct JSON parse
      return JSON.parse(response);
    } catch (firstError) {
      console.log('Direct parse failed, trying to clean response...');
      
      try {
        // Clean the response - remove trailing commas and markdown
        let cleanedResponse = response
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas before } or ]
          .trim();
        
        // Check if response seems truncated (doesn't end with ] properly)
        if (!cleanedResponse.endsWith(']')) {
          console.log('Response appears truncated, attempting to fix...');
          
          // Try to find the last complete object and close the array
          const lastCompleteObject = cleanedResponse.lastIndexOf('}');
          if (lastCompleteObject > -1) {
            cleanedResponse = cleanedResponse.substring(0, lastCompleteObject + 1) + ']';
            console.log('Attempted to fix truncated response');
          }
        }
        
        console.log('Cleaned response:', cleanedResponse.substring(0, 200) + '...');
        return JSON.parse(cleanedResponse);
        
      } catch (secondError) {
        console.log('Cleaned parse failed, trying regex extraction...');
        
        try {
          // Look for JSON array in the text
          const jsonMatch = response.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            let extractedJson = jsonMatch[0]
              .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
            
            return JSON.parse(extractedJson);
          }
          
          // If no complete array found, try to extract partial objects
          const objectMatches = response.match(/\{[^}]*\}/g);
          if (objectMatches && objectMatches.length > 0) {
            console.log('Found partial objects, attempting to reconstruct...');
            const validObjects = [];
            
            objectMatches.forEach(objStr => {
              try {
                const obj = JSON.parse(objStr.replace(/,(\s*})/g, '$1'));
                validObjects.push(obj);
              } catch (e) {
                // Skip invalid objects
              }
            });
            
            if (validObjects.length > 0) {
              console.log(`Reconstructed ${validObjects.length} valid objects`);
              return validObjects;
            }
          }
          
        } catch (thirdError) {
          console.error('All parsing attempts failed');
          console.error('Original response:', response);
        }
      }
    }
    
    // If all parsing fails, throw the error
    throw new Error('Could not parse JSON response after multiple attempts');
  }
 
  /**
   * Add Spotify links to suggestions.
   * @param {Array} suggestions 
   * @returns {Promise<Array>}
   */
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

 /**
   * Get fallback songs in case of AI/service failure.
   * @param {string} type 
   * @param {string|null} mood 
   * @param {string} language 
   * @returns {Array}
   */
  static getFallbackSongs(type, mood, language = "mixed") {
    const langBlock = NOTES_FALLBACK_SONGS[language] || NOTES_FALLBACK_SONGS['mixed'];
    
    if (type === 'trending') {
      return langBlock.trending || langBlock.default || [];
    } else if (mood && type === 'mood') {
      const moodLower = mood.toLowerCase();
      if (moodLower.includes('happy') || moodLower.includes('excited')) {
        return langBlock.happy || langBlock.default || [];
      } else if (moodLower.includes('sad') || moodLower.includes('missing') || moodLower.includes('nostalgic')) {
        return langBlock.sad || langBlock.default || [];
      } else if (moodLower.includes('confident') || moodLower.includes('motivated')) {
        return langBlock.confident || langBlock.default || [];
      }
    }
    
    return langBlock.default || [];
  }
}

module.exports = NotesService;