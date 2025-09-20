// script.js - Main JavaScript functionality
const form = document.getElementById("uploadForm");
const loading = document.getElementById("loading");
const results = document.getElementById("results");
const error = document.getElementById("error");
const fileInput = document.getElementById("fileInput");
const previewImage = document.getElementById("previewImage");
const uploadArea = document.querySelector(".upload-area");

// File preview functionality
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

// Drag and drop functionality
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

// Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  // Show loading state
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

// Display results with uploaded photo and collapsible analysis
function displayResults(data) {
  // Create photo display section
  const photoSection = data.uploadedPhoto ? `
    <div class="uploaded-photo-section">
      <h3>Your Photo:</h3>
      <img src="${data.uploadedPhoto}" alt="Uploaded photo" class="uploaded-photo" />
    </div>
  ` : '';

  // Create collapsible analysis section
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
        
        ${song.best_clip ? `
          <div class="clip-suggestion-compact">
            <div class="clip-time-badge">${song.best_clip.start_time} - ${song.best_clip.end_time}</div>
            <div class="clip-description">${song.best_clip.section}: ${song.best_clip.why_perfect}</div>
          </div>
        ` : ''}
        
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

// Toggle analysis visibility
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

// Error handling
function showError(message) {
  document.getElementById("errorMessage").textContent = message;
  error.style.display = "block";
}

// Reset form
function resetForm() {
  form.style.display = "block";
  results.style.display = "none";
  error.style.display = "none";
  form.reset();
  previewImage.style.display = "none";
}

// Instagram Notes functionality
function showMoodForm() {
  document.getElementById('moodForm').style.display = 'block';
  document.getElementById('notesResults').style.display = 'none';
  document.getElementById('notesError').style.display = 'none';
  document.getElementById('moodInput').focus();
}

async function getMoodSongs() {
  const mood = document.getElementById('moodInput').value.trim();
  const language = document.querySelector('input[name="language"]:checked').value;

  if (!mood) {
    alert('Please tell us how you\'re feeling!');
    return;
  }

  showNotesLoading();

  try {
    const response = await fetch('/api/notes/mood', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mood, language })
    });

    const data = await response.json();

    if (data.success) {
      displayNotesResults(data, `Songs for when you're feeling: "${mood}"`);
    } else {
      showNotesError(data.error || 'Could not get song suggestions');
    }
  } catch (err) {
    showNotesError('Network error. Please try again.');
  }

  hideNotesLoading();
}

async function getTrendingSongs() {
  const language = 'mixed';

  showNotesLoading();

  try {
    const response = await fetch(`/api/notes/trending?language=${language}`);
    const data = await response.json();

    if (data.success) {
      displayNotesResults(data, "🔥 Trending Instagram Notes Songs");
    } else {
      showNotesError(data.error || 'Could not get trending songs');
    }
  } catch (err) {
    showNotesError('Network error. Please try again.');
  }

  hideNotesLoading();
}

function displayNotesResults(data, title) {
  document.getElementById('notesDescription').innerHTML = `<strong>${title}</strong><br>Perfect for Instagram Notes!`;
  
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
      </div>
      
      <div class="song-reason">${song.reason}</div>
      
      ${song.best_clip ? `
        <div class="clip-suggestion">
          <div class="clip-header">
            <i class="fas fa-clock"></i>
            <span class="clip-time">${song.best_clip.start_time} - ${song.best_clip.end_time}</span>
            <span class="clip-duration">(${song.best_clip.duration})</span>
          </div>
          <div class="clip-section">
            <strong>${song.best_clip.section.charAt(0).toUpperCase() + song.best_clip.section.slice(1)}:</strong>
            ${song.best_clip.why_perfect}
          </div>
        </div>
      ` : ''}
      
      <div class="song-controls">
        <a href="${song.spotify_url}" target="_blank" class="spotify-link">
          <i class="fab fa-spotify"></i>
          Open in Spotify
        </a>
      </div>
    </div>
  `).join('');
  
  document.getElementById('notesSongs').innerHTML = songsHTML;
  document.getElementById('notesResults').style.display = 'block';
}

function showNotesLoading() {
  document.getElementById('moodForm').style.display = 'none';
  document.getElementById('notesLoading').style.display = 'block';
  document.getElementById('notesResults').style.display = 'none';
  document.getElementById('notesError').style.display = 'none';
}

function hideNotesLoading() {
  document.getElementById('notesLoading').style.display = 'none';
}

function showNotesError(message) {
  document.getElementById('notesErrorMessage').textContent = message;
  document.getElementById('notesError').style.display = 'block';
}

function resetNotesForm() {
  document.getElementById('moodForm').style.display = 'block';
  document.getElementById('notesResults').style.display = 'none';
  document.getElementById('notesError').style.display = 'none';
  document.getElementById('moodInput').value = '';
}

// Smooth scrolling for better UX
function scrollToResults() {
  document.getElementById('results').scrollIntoView({ 
    behavior: 'smooth' 
  });
}

// Add scroll to results after displaying them
const originalDisplayResults = displayResults;
displayResults = function(data) {
  originalDisplayResults(data);
  setTimeout(scrollToResults, 100);
};