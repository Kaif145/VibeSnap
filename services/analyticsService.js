// services/analyticsService.js - MongoDB analytics tracking
const { MongoClient } = require('mongodb');

class AnalyticsService {
  static async getDatabase() {
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      return client.db('vibesnap_analytics');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  static async trackPhotoUpload(description, preference, language = 'mixed', userAgent = '', ip = '') {
    try {
      const db = await this.getDatabase();
      const collection = db.collection('photo_uploads');
      
      const uploadData = {
        timestamp: new Date(),
        date: new Date().toISOString().split('T')[0],
        hour: new Date().getHours(),
        description,
        preference: preference || null,
        language: language.toLowerCase(),
        photoType: this.detectPhotoType(description),
        mood: this.detectMood(description),
        preferenceCategory: preference ? this.categorizePreference(preference) : null,
        timeOfDay: this.getTimeCategory(new Date().getHours()),
        userAgent: userAgent.substring(0, 200), // Limit length
        ipHash: this.hashIP(ip), // Store hashed IP for privacy
        processingSuccess: true
      };
      
      await collection.insertOne(uploadData);
      
      // Also update daily summary
      await this.updateDailySummary(db, uploadData.date);
      
      console.log('📊 Analytics saved to MongoDB');
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw error - analytics shouldn't break the main app
    }
  }

  static async updateDailySummary(db, date) {
    const summaryCollection = db.collection('daily_summaries');
    
    await summaryCollection.updateOne(
      { date },
      {
        $inc: { totalUploads: 1 },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true }
    );
  }

  static async getAnalytics() {
    try {
      const db = await this.getDatabase();
      const uploadsCollection = db.collection('photo_uploads');
      
      // Get total uploads
      const totalUploads = await uploadsCollection.countDocuments();
      
      // Get last 30 days data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Aggregate data
      const [
        photoTypes,
        moods,
        preferences,
        languages,
        timeOfDay,
        dailyStats
      ] = await Promise.all([
        this.aggregateField(uploadsCollection, 'photoType'),
        this.aggregateField(uploadsCollection, 'mood'),
        this.aggregateField(uploadsCollection, 'preferenceCategory'),
        this.aggregateField(uploadsCollection, 'language'),
        this.aggregateField(uploadsCollection, 'timeOfDay'),
        this.getDailyStats(uploadsCollection, 30)
      ]);
      
      return {
        totalUploads,
        photoTypes: this.formatAggregation(photoTypes),
        moods: this.formatAggregation(moods),
        preferences: this.formatAggregation(preferences),
        languages: this.formatAggregation(languages),
        timeOfDay: this.formatAggregation(timeOfDay),
        dailyStats,
        insights: {
          last7Days: await this.getDailyStats(uploadsCollection, 7),
          topMood: this.getTopFromAggregation(moods),
          topPhotoType: this.getTopFromAggregation(photoTypes),
          topPreference: this.getTopFromAggregation(preferences),
          avgUploadsPerDay: await this.getAverageUploadsPerDay(uploadsCollection)
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get analytics error:', error);
      throw error;
    }
  }

  static async aggregateField(collection, fieldName) {
    return await collection.aggregate([
      { $match: { [fieldName]: { $exists: true, $ne: null } } },
      { $group: { _id: `${fieldName}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
  }

  static async getDailyStats(collection, days) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    const dailyData = await collection.aggregate([
      { $match: { timestamp: { $gte: daysAgo } } },
      { $group: { _id: '$date', uploads: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    // Fill in missing days with 0
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = dailyData.find(d => d._id === dateStr);
      result.push({
        date: dateStr,
        uploads: dayData ? dayData.uploads : 0
      });
    }
    
    return result;
  }

  static async getAverageUploadsPerDay(collection) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const totalUploads = await collection.countDocuments({
      timestamp: { $gte: thirtyDaysAgo }
    });
    
    return Math.round(totalUploads / 30 * 10) / 10;
  }

  static formatAggregation(aggregation) {
    const result = {};
    aggregation.forEach(item => {
      result[item._id] = item.count;
    });
    return result;
  }

  static getTopFromAggregation(aggregation) {
    return aggregation.length > 0 ? aggregation[0]._id : 'unknown';
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

  static hashIP(ip) {
    // Simple hash for privacy - don't store actual IPs
    if (!ip) return null;
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

module.exports = AnalyticsService;