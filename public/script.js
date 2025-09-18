const form = document.getElementById("uploadForm");
      const loading = document.getElementById("loading");
      const results = document.getElementById("results");
      const error = document.getElementById("error");
      const fileInput = document.getElementById("fileInput");
      const previewImage = document.getElementById("previewImage");
      const uploadArea = document.querySelector(".upload-area");

      // File preview
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

      // Drag and drop
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
        const submitBtn = document.getElementById("submitBtn");

        // Show loading
        form.style.display = "none";
        loading.style.display = "block";
        results.style.display = "none";
        error.style.display = "none";

        try {
          const response = await fetch('/api/upload', {
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

      function displayResults(data) {
        document.getElementById(
          "description"
        ).innerHTML = `<strong>Photo Analysis:</strong><br>${data.description}`;

        const songsHTML = data.suggestions
          .map(
            (song) => `
        <div class="song">
            <div class="song-title">${song.title}</div>
            <div class="song-artist">by ${song.artist}</div>
            <div class="song-info">
                <span class="song-mood">${song.mood}</span>
                <span class="song-genre">${song.genre}</span>
            </div>
            <div class="song-reason">${song.reason}</div>
            <div class="song-controls">
                <a href="${song.spotify_url}" target="_blank" class="spotify-link" aria-label="Open ${song.title} in Spotify">
                    🎵 Open in Spotify
                </a>
            </div>
        </div>
    `
          )
          .join("");

        document.getElementById("songs").innerHTML = songsHTML;
        results.style.display = "block";
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