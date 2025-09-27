// routes/stories.js - Instagram Stories route definitions
const express = require("express");
const StoriesController = require("../controllers/storiesController");
// const { validateStoriesRequest } = require("../middleware/validation");

const router = express.Router();

console.log("StoriesController:", StoriesController);

// Get songs for Instagram Stories based on mood
router.post("/stories/mood", 
  // validateStoriesRequest,
  StoriesController.getMoodBasedSongs
);

// Get trending songs for Instagram Stories
router.get("/stories/trending",
  StoriesController.getTrendingSongs
);

module.exports = router;

