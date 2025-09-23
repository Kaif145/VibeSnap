// routes/notes.js - Instagram Notes route definitions
const express = require("express");
const NotesController = require("../controllers/notesController");
// const { validateNotesRequest } = require("../middleware/validation");

const router = express.Router();

console.log("NotesController:", NotesController);


// Get songs for Instagram Notes based on mood
router.post("/notes/mood", 
  // validateNotesRequest,
  NotesController.getMoodBasedSongs
);

// Get songs for Instagram Story
router.post("/notes/story",
  // validateNotesRequest, 
  NotesController.getStorySongs
);

// Get trending songs for Instagram Notes
router.get("/notes/trending",
  NotesController.getTrendingSongs
);


module.exports = router;