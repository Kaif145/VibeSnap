// ========= Language Dropdown Setup =========
document.addEventListener('DOMContentLoaded', () => {
  // No complex language expansion needed - using simple dropdowns
  console.log('Language dropdowns initialized');
});

// ========= Photo Upload Functionality =========
const form = document.getElementById("uploadForm");
const loading = document.getElementById("loading");
const results = document.getElementById("results");
const error = document.getElementById("error");
const fileInput = document.getElementById("fileInput");
const previewImage = document.getElementById("previewImage");
const uploadArea = document.querySelector(".upload-area");

if (fileInput) {
  fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImage.src = e.target.result;
        previewImage.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });
}

if (uploadArea) {
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      fileInput.dispatchEvent(new Event("change"));
    }
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    form.style.display = "none";
    loading.style.display = "block";
    results.style.display = "none";
    error.style.display = "none";

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        displayResults(data);
      } else {
        showError(data.error || "Something went wrong");
      }
    } catch (err) {
      showError("Network error. Please check your connection.");
    }

    loading.style.display = "none";
  });
}

function displayResults(data) {
  const photoSection = data.uploadedPhoto ? `
    <div class="uploaded-photo-section">
      <h3>Your Photo:</h3>
      <img src="${data.uploadedPhoto}" alt="Uploaded photo" class="uploaded-photo" />
    </div>
  ` : '';

  const analysisSection = `
    <div class="analysis-toggle-section">
      <button class="analysis-toggle-btn" onclick="toggleAnalysis()">
        <i class="fas fa-eye" id="analysisIcon"></i>
        <span id="analysisButtonText">View Photo Analysis</span>
      </button>
      <div class="analysis-content" id="analysisContent" style="display: none;">
        <div class="analysis-text">${data.description}</div>
      </div>
    </div>
  `;

  document.getElementById("description").innerHTML = `${photoSection}${analysisSection}`;

  const songsHTML = data.suggestions
    .map((song) => `
      <div class="song">
        <div class="song-header">
          <div class="song-title">${song.title}</div>
          <div class="song-artist">by ${song.artist}</div>
        </div>
        <div class="song-info">
          <span class="song-mood">${song.mood}</span>
          <span class="song-genre">${song.genre}</span>
        </div>
        <div class="song-reason">${song.reason}</div>
        <div class="song-controls">
          <a href="${song.spotify_url}" target="_blank" class="spotify-link" aria-label="Open ${song.title} in Spotify">
            <i class="fab fa-spotify"></i>
            Open in Spotify
          </a>
        </div>
      </div>
    `)
    .join("");

  document.getElementById("songs").innerHTML = songsHTML;
  results.style.display = "block";
}

function toggleAnalysis() {
  const content = document.getElementById('analysisContent');
  const icon = document.getElementById('analysisIcon');
  const buttonText = document.getElementById('analysisButtonText');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.className = 'fas fa-eye-slash';
    buttonText.textContent = 'Hide Photo Analysis';
  } else {
    content.style.display = 'none';
    icon.className = 'fas fa-eye';
    buttonText.textContent = 'View Photo Analysis';
  }
}

function showError(message) {
  document.getElementById("errorMessage").textContent = message;
  error.style.display = "block";
}

function resetForm() {
  form.style.display = "block";
  results.style.display = "none";
  error.style.display = "none";
  form.reset();
  previewImage.style.display = "none";
}

// ========= Notes/Show More Logic =========
let notesLastMood = '';
let notesLastLanguage = '';
let notesShownTitles = [];
let notesResultsTitle = '';
let notesIsLoading = false;

// ========= Trending/Show More Logic =========
let trendingLastLanguage = '';
let trendingShownTitles = [];
let trendingIsLoading = false;

// ========= Social Blade API Integration =========
const SOCIAL_BLADE_CONFIG = {
  baseUrl: 'https://api.socialblade.com/v3',
  clientId: 'cli_c58f9d5b4feaebcf4fcb3805', // Replace with your actual client ID
  token: '4932bd3e27e954451821042b41af4bd1cc72b07d3ead81396d5c97eb70018f28' // Replace with your actual token
};

// Get trending TikTok sounds/music
async function getTikTokTrendingData() {
  try {
    const response = await fetch(`${SOCIAL_BLADE_CONFIG.baseUrl}/tiktok/trending/sounds`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SOCIAL_BLADE_CONFIG.token}`,
        'X-Client-ID': SOCIAL_BLADE_CONFIG.clientId,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`TikTok API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching TikTok trending data:', error);
    return null;
  }
}

// Get trending Instagram music/hashtags
async function getInstagramTrendingData() {
  try {
    const response = await fetch(`${SOCIAL_BLADE_CONFIG.baseUrl}/instagram/trending/music`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SOCIAL_BLADE_CONFIG.token}`,
        'X-Client-ID': SOCIAL_BLADE_CONFIG.clientId,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Instagram trending data:', error);
    return null;
  }
}

// Get comprehensive viral data
async function getViralTrendingData() {
  try {
    const [tiktokData, instagramData] = await Promise.all([
      getTikTokTrendingData(),
      getInstagramTrendingData()
    ]);
    
    return {
      tiktok: tiktokData,
      instagram: instagramData,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error fetching viral trending data:', error);
    return null;
  }
}

function showMoodForm() {
  document.getElementById('moodForm').style.display = 'block';
  document.getElementById('trendingLanguageForm').style.display = 'none';
  document.getElementById('notesResults').style.display = 'none';
  document.getElementById('notesError').style.display = 'none';
  document.getElementById('showMoreNotesBtn').style.display = 'none';
  document.getElementById('moodInput').focus();
}

function showTrendingLanguageForm() {
  document.getElementById('trendingLanguageForm').style.display = 'block';
  document.getElementById('moodForm').style.display = 'none';
  document.getElementById('notesResults').style.display = 'none';
  document.getElementById('notesError').style.display = 'none';
  document.getElementById('showMoreNotesBtn').style.display = 'none';
}

async function getMoodSongs() {
  const mood = document.getElementById('moodInput').value.trim();
  const languageSelect = document.getElementById('moodLanguageSelect');
  const language = languageSelect ? languageSelect.value : 'mixed';

  if (!mood) {
    alert('Please tell us how you\'re feeling!');
    return;
  }

  notesLastMood = mood;
  notesLastLanguage = language;
  notesShownTitles = [];
  notesResultsTitle = `Songs for when you're feeling: "${mood}"`;

  showNotesLoading();

  try {
    // Get viral trending data for better mood matching
    const viralData = await getViralTrendingData();
    
    const requestBody = { 
      mood, 
      language, 
      prevTitles: [],
      includeViral: true,
      viralData: viralData,
      enhancedMatching: true
    };

    const response = await fetch('/api/notes/mood', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.success) {
      notesShownTitles = data.suggestions.map(song => song.title);
      
      // Enhanced title with viral context if available
      const enhancedTitle = viralData ? 
        `${notesResultsTitle} (Enhanced with viral trends)` : 
        notesResultsTitle;
        
      displayNotesResults(data, enhancedTitle, false);
      document.getElementById('showMoreNotesBtn').style.display = data.suggestions.length >= 10 ? 'block' : 'none';
    } else {
      showNotesError(data.error || 'Could not get song suggestions');
      document.getElementById('showMoreNotesBtn').style.display = 'none';
    }
  } catch (err) {
    console.error('Error getting mood songs:', err);
    showNotesError('Network error. Please try again.');
    document.getElementById('showMoreNotesBtn').style.display = 'none';
  }

  hideNotesLoading();
}

async function getMoreMoodSongs() {
  if (!notesLastMood || !notesLastLanguage) return;

  showNotesLoading();

  try {
    const response = await fetch('/api/notes/mood', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mood: notesLastMood,
        language: notesLastLanguage,
        prevTitles: notesShownTitles
      })
    });

    const data = await response.json();

    if (data.success) {
      notesShownTitles = notesShownTitles.concat(data.suggestions.map(song => song.title));
      displayNotesResults(data, notesResultsTitle, true);
      if (data.suggestions.length < 5) {
        document.getElementById('showMoreNotesBtn').style.display = 'none';
      }
    } else {
      showNotesError(data.error || 'Could not get more songs');
      document.getElementById('showMoreNotesBtn').style.display = 'none';
    }
  } catch (err) {
    showNotesError('Network error. Please try again.');
    document.getElementById('showMoreNotesBtn').style.display = 'none';
  }

  hideNotesLoading();
}

async function getTrendingSongs() {
  const languageSelect = document.getElementById('trendingLanguageSelect');
  const language = languageSelect ? languageSelect.value : 'mixed';

  trendingLastLanguage = language;
  trendingShownTitles = [];

  showNotesLoading();

  try {
    // Get viral trending data from Social Blade
    const viralData = await getViralTrendingData();
    
    // Enhanced API call with viral context
    const apiUrl = `/api/notes/trending?language=${language}&includeViral=true&viralData=${encodeURIComponent(JSON.stringify(viralData))}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.success) {
      trendingShownTitles = data.suggestions.map(song => song.title);
      
      // Enhanced title with viral context
      const title = viralData ? "🔥 Viral Songs Right Now (TikTok + Instagram)" : "🔥 Trending Songs Right Now";
      displayNotesResults(data, title, false);
      document.getElementById('showMoreNotesBtn').style.display = data.suggestions.length >= 10 ? 'block' : 'none';
    } else {
      showNotesError(data.error || 'Could not get trending songs');
      document.getElementById('showMoreNotesBtn').style.display = 'none';
    }
  } catch (err) {
    console.error('Error getting trending songs:', err);
    showNotesError('Network error. Please try again.');
    document.getElementById('showMoreNotesBtn').style.display = 'none';
  }

  hideNotesLoading();
}

// ========= Viral Songs Function =========
async function getViralSongs() {
  showNotesLoading();

  try {
    // Get comprehensive viral data
    const viralData = await getViralTrendingData();
    
    if (!viralData) {
      showNotesError('Could not fetch viral trending data');
      hideNotesLoading();
      return;
    }

    // Process viral data into song suggestions
    const viralSongs = processViralData(viralData);
    
    if (viralSongs.length === 0) {
      showNotesError('No viral songs found at the moment');
      hideNotesLoading();
      return;
    }

    // Display viral songs
    const mockData = {
      success: true,
      suggestions: viralSongs
    };

    displayNotesResults(mockData, "🚀 Viral Songs (TikTok + Instagram)", false);
    document.getElementById('showMoreNotesBtn').style.display = 'none';
    
  } catch (err) {
    console.error('Error getting viral songs:', err);
    showNotesError('Network error. Please try again.');
  }

  hideNotesLoading();
}

// Process viral data into song format
function processViralData(viralData) {
  const songs = [];
  
  // Process TikTok viral sounds
  if (viralData.tiktok && viralData.tiktok.sounds) {
    viralData.tiktok.sounds.forEach((sound, index) => {
      songs.push({
        title: sound.title || `TikTok Viral Sound ${index + 1}`,
        artist: sound.artist || 'TikTok Creator',
        mood: 'Viral',
        genre: 'Trending',
        reason: `🔥 Going viral on TikTok with ${sound.usage_count || 0} uses`,
        spotify_url: sound.spotify_url || '#',
        language: 'Mixed',
        market: 'Global',
        lyrics_snippet: sound.lyrics_snippet || 'Currently trending on TikTok!'
      });
    });
  }
  
  // Process Instagram viral music
  if (viralData.instagram && viralData.instagram.music) {
    viralData.instagram.music.forEach((music, index) => {
      songs.push({
        title: music.title || `Instagram Viral ${index + 1}`,
        artist: music.artist || 'Instagram Creator',
        mood: 'Viral',
        genre: 'Trending',
        reason: `📸 Trending on Instagram Stories with ${music.usage_count || 0} posts`,
        spotify_url: music.spotify_url || '#',
        language: 'Mixed',
        market: 'Global',
        lyrics_snippet: music.lyrics_snippet || 'Perfect for Instagram Stories!'
      });
    });
  }
  
  return songs.slice(0, 10); // Limit to 10 songs
}

async function getMoreTrendingSongs() {
  if (!trendingLastLanguage) return;

  showNotesLoading();

  try {
    const response = await fetch(`/api/notes/trending?language=${trendingLastLanguage}&prevTitles=${encodeURIComponent(JSON.stringify(trendingShownTitles))}`);
    const data = await response.json();

    if (data.success) {
      trendingShownTitles = trendingShownTitles.concat(data.suggestions.map(song => song.title));
      displayNotesResults(data, "🔥 Trending Songs Right Now", true);
      if (data.suggestions.length < 5) {
        document.getElementById('showMoreNotesBtn').style.display = 'none';
      }
    } else {
      showNotesError(data.error || 'Could not get more trending songs');
      document.getElementById('showMoreNotesBtn').style.display = 'none';
    }
  } catch (err) {
    showNotesError('Network error. Please try again.');
    document.getElementById('showMoreNotesBtn').style.display = 'none';
  }

  hideNotesLoading();
}

function displayNotesResults(data, title, append = false) {
  if (!append) {
    document.getElementById('notesDescription').innerHTML = `<strong>${title}</strong><br>Perfect for Instagram!`;
    document.getElementById('notesSongs').innerHTML = '';
  }
  const songsHTML = data.suggestions.map((song) => `
    <div class="song">
      <div class="song-header">
        <div class="song-title">${song.title}</div>
        <div class="song-artist">by ${song.artist}</div>
      </div>
      <div class="song-info">
        <span class="song-mood">${song.mood}</span>
        <span class="song-genre">${song.genre}</span>
        ${song.language ? `<span class="song-language">${song.language}</span>` : ''}
        ${song.market ? `<span class="song-market">${song.market}</span>` : ''}
      </div>
      <div class="song-lyrics">${song.lyrics_snippet ? `"${song.lyrics_snippet}"` : ''}</div>
      <div class="song-reason">${song.reason}</div>
      <div class="song-controls">
        <a href="${song.spotify_url}" target="_blank" class="spotify-link">
          <i class="fab fa-spotify"></i>
          Open in Spotify
        </a>
      </div>
    </div>
  `).join('');
  document.getElementById('notesSongs').insertAdjacentHTML(append ? 'beforeend' : 'afterbegin', songsHTML);
  document.getElementById('notesResults').style.display = 'block';
}

function showNotesLoading() {
  notesIsLoading = true;
  document.getElementById('moodForm').style.display = 'none';
  document.getElementById('notesLoading').style.display = 'block';
  document.getElementById('notesResults').style.display = 'none';
  document.getElementById('notesError').style.display = 'none';
}

function hideNotesLoading() {
  notesIsLoading = false;
  document.getElementById('notesLoading').style.display = 'none';
}

function showNotesError(message) {
  document.getElementById('notesErrorMessage').textContent = message;
  document.getElementById('notesError').style.display = 'block';
}

function resetNotesForm() {
  notesLastMood = '';
  notesLastLanguage = '';
  notesShownTitles = [];
  notesResultsTitle = '';
  trendingLastLanguage = '';
  trendingShownTitles = [];
  document.getElementById('moodForm').style.display = 'none';
  document.getElementById('trendingLanguageForm').style.display = 'none';
  document.getElementById('notesResults').style.display = 'none';
  document.getElementById('notesError').style.display = 'none';
  document.getElementById('showMoreNotesBtn').style.display = 'none';
  document.getElementById('moodInput').value = '';
}

// Tab Navigation
function showTab(tabId, element) {
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(tab => tab.classList.remove('active'));
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  element.classList.add('active');
  if (tabId === 'photo-tab') {
    resetForm();
  } else if (tabId === 'notes-tab') {
    resetNotesForm();
  }
}

// Event listeners for Notes section "Show More" button
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('showMoreNotesBtn')) {
    document.getElementById('showMoreNotesBtn').addEventListener('click', function() {
      // Check if we're in mood mode or trending mode
      if (notesLastMood) {
        getMoreMoodSongs();
      } else if (trendingLastLanguage) {
        getMoreTrendingSongs();
      }
    });
    document.getElementById('showMoreNotesBtn').style.display = 'none';
  }
});