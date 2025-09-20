// services/analyticsService.js - Simple analytics tracking
const fs = require('fs');
const path = require('path');

class AnalyticsService {
  static getAnalyticsFilePath() {
    return path.join(__dirname, '../analytics.json');
  }

  static loadAnalytics() {
    try {
      const filePath = this.getAnalyticsFilePath();
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    
    // Return default structure if file doesn't exist or error
    return {
      totalUploads: 0,
      dailyStats: {},
      photoTypes: {
        indoor: 0,
        outdoor: 0,
        selfie: 0,
        group: 0,
        other: 0
      },
      moods: {
        energetic: 0,
        chill: 0,
        romantic: 0,
        confident: 0,
        melancholic: 0,
        other: 0
      },
      preferences: {
        pop: 0,
        hip_hop: 0,
        indie: 0,
        electronic: 0,
        rock: 0,
        other: 0
      },
      languages: {
        english: 0,
        hindi: 0,
        mixed: 0
      },
      timeOfDay: {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0
      },
      lastUpdated: new Date().toISOString()
    };
  }

  static saveAnalytics(data) {
    try {
      const filePath = this.getAnalyticsFilePath();
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving analytics:', error);
    }
  }

  static trackPhotoUpload(description, preference, language = 'mixed') {
    const analytics = this.loadAnalytics();
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
    // Increment total uploads
    analytics.totalUploads++;
    
    // Track daily stats
    if (!analytics.dailyStats[today]) {
      analytics.dailyStats[today] = 0;
    }
    analytics.dailyStats[today]++;
    
    // Analyze photo type from description
    const photoType = this.detectPhotoType(description);
    analytics.photoTypes[photoType]++;
    
    // Analyze mood from description
    const mood = this.detectMood(description);
    analytics.moods[mood]++;
    
    // Track music preference
    if (preference) {
      const prefCategory = this.categorizePreference(preference);
      analytics.preferences[prefCategory]++;
    }
    
    // Track language preference
    analytics.languages[language.toLowerCase()]++;
    
    // Track time of day
    const timeCategory = this.getTimeCategory(hour);
    analytics.timeOfDay[timeCategory]++;
    
    this.saveAnalytics(analytics);
    
    console.log(`📊 Analytics updated - Total uploads: ${analytics.totalUploads}`);
  }

  static detectPhotoType(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('indoor') || desc.includes('bedroom') || desc.includes('kitchen') || desc.includes('office')) {
      return 'indoor';
    } else if (desc.includes('outdoor') || desc.includes('nature') || desc.includes('beach') || desc.includes('park')) {
      return 'outdoor';
    } else if (desc.includes('selfie') || desc.includes('self-portrait') || desc.includes('mirror')) {
      return 'selfie';
    } else if (desc.includes('group') || desc.includes('people') || desc.includes('friends')) {
      return 'group';
    }
    
    return 'other';
  }

  static detectMood(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('energetic') || desc.includes('vibrant') || desc.includes('dynamic')) {
      return 'energetic';
    } else if (desc.includes('chill') || desc.includes('relaxed') || desc.includes('cozy')) {
      return 'chill';
    } else if (desc.includes('romantic') || desc.includes('intimate') || desc.includes('love')) {
      return 'romantic';
    } else if (desc.includes('confident') || desc.includes('powerful') || desc.includes('strong')) {
      return 'confident';
    } else if (desc.includes('sad') || desc.includes('melancholic') || desc.includes('moody')) {
      return 'melancholic';
    }
    
    return 'other';
  }

  static categorizePreference(preference) {
    const pref = preference.toLowerCase();
    
    if (pref.includes('pop')) return 'pop';
    if (pref.includes('hip') || pref.includes('rap') || pref.includes('trap')) return 'hip_hop';
    if (pref.includes('indie') || pref.includes('alternative')) return 'indie';
    if (pref.includes('electronic') || pref.includes('edm') || pref.includes('techno')) return 'electronic';
    if (pref.includes('rock') || pref.includes('metal')) return 'rock';
    
    return 'other';
  }

  static getTimeCategory(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  static getAnalytics() {
    const analytics = this.loadAnalytics();
    
    // Calculate additional insights
    const last7Days = this.getLast7DaysStats(analytics.dailyStats);
    const topMood = this.getTopCategory(analytics.moods);
    const topPhotoType = this.getTopCategory(analytics.photoTypes);
    const topPreference = this.getTopCategory(analytics.preferences);
    
    return {
      ...analytics,
      insights: {
        last7Days,
        topMood,
        topPhotoType,
        topPreference,
        avgUploadsPerDay: this.getAverageUploadsPerDay(analytics.dailyStats)
      }
    };
  }

  static getLast7DaysStats(dailyStats) {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push({
        date: dateStr,
        uploads: dailyStats[dateStr] || 0
      });
    }
    return last7Days;
  }

  static getTopCategory(categories) {
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  static getAverageUploadsPerDay(dailyStats) {
    const days = Object.keys(dailyStats);
    if (days.length === 0) return 0;
    
    const totalUploads = Object.values(dailyStats).reduce((sum, count) => sum + count, 0);
    return Math.round(totalUploads / days.length * 10) / 10;
  }
}

module.exports = AnalyticsService;