const multer = require("multer");
const path = require("path");

const upload = multer({ 
  dest: path.join(__dirname, "../uploads/"),
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only 1 file at a time
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only JPG, JPEG, PNG, and WebP files are allowed.');
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

module.exports = upload;