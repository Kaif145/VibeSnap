// utils/constants.js - Application constants
const SMART_FALLBACKS = [
  "Indoor setting with warm lighting and casual vibes. Person looks relaxed and confident, perfect for chill but upbeat music. Modern aesthetic with good composition.",
  "Outdoor photo with natural lighting and energetic atmosphere. Bright colors and positive mood suggest upbeat, feel-good music would match perfectly.",
  "Lifestyle photo with trendy aesthetic and main character energy. Good lighting and stylish composition call for popular, Instagram-worthy songs.",
  "Casual indoor moment with cozy vibes and authentic feel. Soft lighting and relaxed mood would pair well with chill, acoustic, or indie music.",
  "Dynamic photo with vibrant energy and social atmosphere. Bright setting and active mood suggest high-energy, party, or trending music."
];

const FALLBACK_SONGS = {
  chill: [
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
  ],
  
  energetic: [
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
  ],
  
  outdoor: [
    {
      "title": "Blinding Lights",
      "artist": "The Weeknd",
      "mood": "uplifting",
      "reason": "Great for outdoor adventures and bright settings",
      "genre": "synth-pop",
      "spotify_url": "https://open.spotify.com/search/Blinding%20Lights%20The%20Weeknd"
    },
    {
      "title": "Watermelon Sugar",
      "artist": "Harry Styles",
      "mood": "summery",
      "reason": "Perfect for outdoor, sunny, feel-good moments",
      "genre": "pop",
      "spotify_url": "https://open.spotify.com/search/Watermelon%20Sugar%20Harry%20Styles"
    }
  ],
  
  default: [
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
  ]
};


const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PREFERENCE_LENGTH = 100;


const NOTES_FALLBACK_SONGS = {
  mixed: {
    mixed: [
      {
        title: "Vienna",
        artist: "Billy Joel",
        mood: "nostalgic",
        reason: "Perfect for thoughtful, rainy, or reflective moods",
        genre: "soft rock",
        spotify_url: "https://open.spotify.com/track/3hQxkRwPjF9hQqv3U3bGJk"
      },
      {
        title: "Let It Go",
        artist: "James Bay",
        mood: "free",
        reason: "Great for moments of relief after stress, like finishing exams",
        genre: "indie folk",
        spotify_url: "https://open.spotify.com/track/4eLSCSELtXh6Wz4G7v7udU"
      },
      {
        title: "Here Comes The Sun",
        artist: "The Beatles",
        mood: "uplifting",
        reason: "Best for positive, fresh-start moments",
        genre: "classic rock",
        spotify_url: "https://open.spotify.com/track/6dGnYIeXmHdcikdzNNDMm2"
      },
      {
        title: "Good Days",
        artist: "SZA",
        mood: "chill",
        reason: "For relaxed, cozy, or introspective moods",
        genre: "R&B",
        spotify_url: "https://open.spotify.com/track/4iJyoBOLtHqaGxP12qzhQI"
      }
    ]
  },
  english: {
    mixed: [
      // You can copy entries from above or add more English-only suggestions
      {
        title: "Put Your Records On",
        artist: "Corinne Bailey Rae",
        mood: "carefree",
        reason: "Feel-good song for sunny, relaxed notes",
        genre: "soul",
        spotify_url: "https://open.spotify.com/track/0Hz9j2SP8P6u0fS6wPSo7e"
      }
    ]
  },
  hindi: {
    mixed: [
      {
        title: "Ilahi",
        artist: "Arijit Singh",
        mood: "free",
        reason: "Perfect for travel, freedom, or post-exam energy",
        genre: "Bollywood",
        spotify_url: "https://open.spotify.com/track/3xZMPaeL3T9g6N1EGX8GFC"
      },
      {
        title: "Phir Le Aaya Dil",
        artist: "Arijit Singh",
        mood: "nostalgic",
        reason: "For nostalgic, rainy, or emotional moments",
        genre: "Bollywood",
        spotify_url: "https://open.spotify.com/track/1R5rCIzQb84F0QurMv0sC9"
      }
    ]
  }
};


module.exports = {
  SMART_FALLBACKS,
  FALLBACK_SONGS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_PREFERENCE_LENGTH,
  NOTES_FALLBACK_SONGS
};