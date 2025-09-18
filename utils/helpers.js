// utils/helpers.js - Utility helper functions
const fs = require("fs");

class Helpers {
  static cleanupFile(filePath, callback) {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.warn(`Could not delete file ${filePath}:`, err);
        }
        if (callback) callback(err);
      });
    } else if (callback) {
      callback(null);
    }
  }

  static sanitizeInput(input, maxLength = 100) {
    if (!input || typeof input !== 'string') return '';
    return input.trim().slice(0, maxLength);
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isValidImageType(mimeType) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(mimeType);
  }

  static generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static logRequest(req) {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`📝 ${timestamp} - ${req.method} ${req.path} - IP: ${ip} - Agent: ${userAgent.slice(0, 50)}...`);
  }

  static getVibeFromDescription(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('chill') || desc.includes('relaxed') || desc.includes('cozy')) {
      return 'chill';
    } else if (desc.includes('energetic') || desc.includes('vibrant') || desc.includes('party')) {
      return 'energetic';
    } else if (desc.includes('romantic') || desc.includes('intimate') || desc.includes('warm')) {
      return 'romantic';
    } else if (desc.includes('dark') || desc.includes('moody') || desc.includes('mysterious')) {
      return 'dark';
    } else if (desc.includes('outdoor') || desc.includes('nature') || desc.includes('adventure')) {
      return 'outdoor';
    }
    
    return 'neutral';
  }

  static createResponse(success, data, error = null, metadata = {}) {
    return {
      success,
      timestamp: new Date().toISOString(),
      ...(data && { ...data }),
      ...(error && { error }),
      ...(Object.keys(metadata).length > 0 && { metadata })
    };
  }
}

module.exports = Helpers;