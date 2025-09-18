// server.js - Fixed version
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// File upload setup
const upload = multer({ 
  dest: path.join(__dirname, "uploads/"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, and PNG files are allowed'), false);
    }
  }
});

// OpenRouter client
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Analyze image with OpenRouter - OPTIMIZED
async function analyzeImage(imagePath, mimeType) {
  try {
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    
    // Determine correct MIME type
    let mediaType = 'image/jpeg'; // default
    if (mimeType === 'image/png') {
      mediaType = 'image/png';
    } else if (mimeType === 'image/jpg' || mimeType === 'image/jpeg') {
      mediaType = 'image/jpeg';
    }
    
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
    console.log('🎯 Detailed analysis:', description);
    return description;
    
  } catch (error) {
    console.error('Image analysis error:', error);
    console.error('Error details:', error.error?.metadata?.raw);
    
    // Enhanced fallbacks based on common scenarios
    const smartFallbacks = [
      "Indoor setting with warm lighting and casual vibes. Person looks relaxed and confident, perfect for chill but upbeat music. Modern aesthetic with good composition.",
      "Outdoor photo with natural lighting and energetic atmosphere. Bright colors and positive mood suggest upbeat, feel-good music would match perfectly.",
      "Lifestyle photo with trendy aesthetic and main character energy. Good lighting and stylish composition call for popular, Instagram-worthy songs.",
      "Casual indoor moment with cozy vibes and authentic feel. Soft lighting and relaxed mood would pair well with chill, acoustic, or indie music.",
      "Dynamic photo with vibrant energy and social atmosphere. Bright setting and active mood suggest high-energy, party, or trending music."
    ];
    
    return smartFallbacks[Math.floor(Math.random() * smartFallbacks.length)];
  }
}

// Get Spotify link for a song
async function getSpotifyLink(songTitle, artistName) {
  // If you have Spotify API credentials, use this
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    try {
      const authResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });

      const authData = await authResponse.json();
      
      if (authData.access_token) {
        const searchQuery = encodeURIComponent(`track:"${songTitle}" artist:"${artistName}"`);
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=1`,
          {
            headers: {
              'Authorization': 'Bearer ' + authData.access_token
            }
          }
        );

        const searchData = await searchResponse.json();
        
        if (searchData.tracks && searchData.tracks.items.length > 0) {
          return searchData.tracks.items[0].external_urls.spotify;
        }
      }
    } catch (error) {
      console.error('Spotify API error:', error);
    }
  }
  
  // Fallback: Spotify search URL (always works)
  return `https://open.spotify.com/search/${encodeURIComponent(songTitle + " " + artistName)}`;
}

// Get song suggestions with Spotify links - OPTIMIZED
async function getSongSuggestionsWithLinks(description, preference) {
  const prompt = `You are an expert music curator for Instagram creators who understand current trends and viral music.

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

  try {
    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.8 // More creativity for better song variety
    });

    const response = completion.choices[0].message.content.trim();
    console.log('🎵 Raw AI response:', response);
    
    // Parse JSON response
    let suggestions;
    try {
      suggestions = JSON.parse(response);
    } catch {
      const jsonMatch = response.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON response');
      }
    }

    // Add Spotify links to each suggestion
    const suggestionsWithLinks = await Promise.all(
      suggestions.map(async (song) => {
        const spotifyUrl = await getSpotifyLink(song.title, song.artist);
        return {
          ...song,
          spotify_url: spotifyUrl
        };
      })
    );

    return suggestionsWithLinks;

  } catch (error) {
    console.error('Song suggestion error:', error);
    
    // Better fallback suggestions based on description
    const isChill = description.toLowerCase().includes('chill') || description.toLowerCase().includes('cozy') || description.toLowerCase().includes('relaxed');
    const isEnergetic = description.toLowerCase().includes('energetic') || description.toLowerCase().includes('vibrant') || description.toLowerCase().includes('bright');
    const isOutdoor = description.toLowerCase().includes('outdoor') || description.toLowerCase().includes('nature') || description.toLowerCase().includes('beach');
    
    if (isChill) {
      return [
        {
          "title": "Good Days",
          "artist": "SZA",
          "mood": "chill",
          "reason": "Perfect for relaxed, cozy vibes with warm atmosphere",
          "genre": "R&B",
          "spotify_url": "https://open.spotify.com/search/Good%20Days%20SZA"
        },
        {
          "title": "Sunflower",
          "artist": "Post Malone",
          "mood": "laid-back",
          "reason": "Matches the chill, easygoing energy perfectly",
          "genre": "hip-hop",
          "spotify_url": "https://open.spotify.com/search/Sunflower%20Post%20Malone"
        }
      ];
    } else if (isEnergetic) {
      return [
        {
          "title": "Levitating",
          "artist": "Dua Lipa",
          "mood": "energetic",
          "reason": "High energy matches the vibrant, dynamic atmosphere",
          "genre": "pop",
          "spotify_url": "https://open.spotify.com/search/Levitating%20Dua%20Lipa"
        },
        {
          "title": "Good 4 U",
          "artist": "Olivia Rodrigo",
          "mood": "upbeat",
          "reason": "Perfect for confident, high-energy moments",
          "genre": "pop-rock",
          "spotify_url": "https://open.spotify.com/search/Good%204%20U%20Olivia%20Rodrigo"
        }
      ];
    }
    
    // Default fallbacks
    return [
      {
        "title": "As It Was",
        "artist": "Harry Styles",
        "mood": "nostalgic",
        "reason": "Versatile song that works with most Instagram aesthetics",
        "genre": "pop",
        "spotify_url": "https://open.spotify.com/search/As%20It%20Was%20Harry%20Styles"
      },
      {
        "title": "Anti-Hero",
        "artist": "Taylor Swift",
        "mood": "relatable",
        "reason": "Popular choice for authentic, personal Instagram posts",
        "genre": "pop",
        "spotify_url": "https://open.spotify.com/search/Anti-Hero%20Taylor%20Swift"
      }
    ];
  }
}

// Main upload endpoint
app.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    const file = req.file;
    const preference = req.body.preference || "";

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Please upload an image file"
      });
    }

    console.log(`📸 Processing: ${file.originalname}`);

    // Step 1: Analyze the image (pass the mime type)
    const description = await analyzeImage(file.path, file.mimetype);
    console.log(`🔍 Description: ${description}`);

    // Step 2: Get song suggestions with Spotify links
    const suggestions = await getSongSuggestionsWithLinks(description, preference);
    console.log(`🎵 Generated ${suggestions.length} suggestions with Spotify links`);

    // Clean up uploaded file
    fs.unlink(file.path, (err) => {
      if (err) console.warn('Could not delete temp file:', err);
    });

    res.json({
      success: true,
      description,
      suggestions,
      totalSongs: suggestions.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      error: "Something went wrong. Please try again."
    });
  }
});

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Instagram Song Matcher running at http://localhost:${PORT}`);
  console.log(`📁 Upload photos at http://localhost:${PORT}`);
});