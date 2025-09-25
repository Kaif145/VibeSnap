// ========= Language Options Expand/Collapse =========
const allLanguages = [
  { value: "mixed", label: "🌏 All (Mixed)" },
  { value: "english", label: "🇺🇸 English" },
  { value: "hindi", label: "🇮🇳 Hindi" },
  { value: "punjabi", label: "🛕 Punjabi" },
  { value: "bengali", label: "🥭 Bengali" },
  { value: "k-pop", label: "🎤 K-pop" },
  { value: "tamil", label: "🕉 Tamil" },
  { value: "telugu", label: "🎬 Telugu" },
  { value: "marathi", label: "🍋 Marathi" },
  { value: "gujarati", label: "🌶 Gujarati" },
  { value: "urdu", label: "🌙 Urdu" },
  { value: "spanish", label: "🇪🇸 Spanish" },
  { value: "french", label: "🇫🇷 French" },
  { value: "arabic", label: "🌴 Arabic" }
];

document.addEventListener('DOMContentLoaded', () => {
  const group = document.getElementById("languageRadioGroup");
  const btn = document.getElementById("showAllLanguagesBtn");
  if (btn) {
    btn.addEventListener("click", function() {
      group.innerHTML = "";
      allLanguages.forEach(lang => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="radio" name="mood-language" value="${lang.value}"> ${lang.label}`;
        group.appendChild(label);
      });
      // Set checked to "mixed" if nothing else is checked
      const checked = document.querySelector('input[name="mood-language"]:checked');
      if (!checked) group.querySelector('input').checked = true;
    });
  }
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

function showMoodForm() {
  document.getElementById('moodForm').style.display = 'block';
  document.getElementById('notesResults').style.display = 'none';
  document.getElementById('notesError').style.display = 'none';
  document.getElementById('showMoreNotesBtn').style.display = 'none';
  document.getElementById('moodInput').focus();
}

async function getMoodSongs() {
  const mood = document.getElementById('moodInput').value.trim();
  const language = document.querySelector('input[name="mood-language"]:checked').value;

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
    const response = await fetch('/api/notes/mood', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mood, language, prevTitles: [] })
    });

    const data = await response.json();

    if (data.success) {
      notesShownTitles = data.suggestions.map(song => song.title);
      displayNotesResults(data, notesResultsTitle, false);
      document.getElementById('showMoreNotesBtn').style.display = data.suggestions.length >= 10 ? 'block' : 'none';
    } else {
      showNotesError(data.error || 'Could not get song suggestions');
      document.getElementById('showMoreNotesBtn').style.display = 'none';
    }
  } catch (err) {
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
  const language = 'mixed';

  showNotesLoading();

  try {
    const response = await fetch(`/api/notes/trending?language=${language}`);
    const data = await response.json();

    if (data.success) {
      displayNotesResults(data, "🔥 Trending Songs Right Now", false);
      document.getElementById('showMoreNotesBtn').style.display = 'none';
    } else {
      showNotesError(data.error || 'Could not get trending songs');
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
  document.getElementById('moodForm').style.display = 'none';
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
    document.getElementById('showMoreNotesBtn').addEventListener('click', getMoreMoodSongs);
    document.getElementById('showMoreNotesBtn').style.display = 'none';
  }
});