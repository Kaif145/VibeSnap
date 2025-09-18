// services/imageAnalysisService.js - Image analysis logic
const fs = require("fs");
const client = require("../config/openai");
const { SMART_FALLBACKS } = require("../utils/constants");

class ImageAnalysisService {
  static async analyzeImage(imagePath, mimeType) {
    try {
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString('base64');
      
      // Determine correct MIME type
      const mediaType = this.getMimeType(mimeType);
      
      const completion = await client.chat.completions.create({
        model: "anthropic/claude-3-haiku",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image in detail for Instagram music matching. Describe:

🏞️ SETTING & LOCATION: Indoor/outdoor, what type of place, specific environment
🎨 VISUAL MOOD: Colors (warm/cool), lighting (bright/dim/golden hour), atmosphere 
😊 EMOTIONAL VIBE: Happy, chill, energetic, romantic, melancholic, confident, cozy
👥 PEOPLE & ACTIVITY: What are people doing, their expressions, group or solo
🌅 TIME & SEASON: Morning/afternoon/evening vibes, seasonal feeling
📱 INSTAGRAM AESTHETIC: Main character energy, soft life, dark academia, etc.

Focus on elements that would influence music choice. Be specific about mood and energy level.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`
              }
            }
          ]
        }],
        max_tokens: 200
      });

      const description = completion.choices[0].message.content.trim();
      console.log('🎯 Image analysis successful');
      return description;
      
    } catch (error) {
      console.error('Image analysis error:', error);
      
      // Return smart fallback based on common scenarios
      return this.getSmartFallback();
    }
  }

  static getMimeType(mimeType) {
    if (mimeType === 'image/png') return 'image/png';
    if (mimeType === 'image/webp') return 'image/webp';
    return 'image/jpeg'; // default
  }

  static getSmartFallback() {
    const fallbacks = SMART_FALLBACKS;
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

module.exports = ImageAnalysisService;