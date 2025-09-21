// controllers/analyticsController.js - Analytics dashboard controller
const AnalyticsService = require("../services/analyticsService");

class AnalyticsController {
  static getAnalytics(req, res) {
    try {
      const analytics = AnalyticsService.getAnalytics();
      
      res.json({
        success: true,
        data: analytics,
        summary: {
          totalUploads: analytics.totalUploads,
          avgPerDay: analytics.insights.avgUploadsPerDay,
          topMood: analytics.insights.topMood,
          topPhotoType: analytics.insights.topPhotoType,
          mostActiveTime: Object.entries(analytics.timeOfDay)
            .sort(([,a], [,b]) => b - a)[0][0]
        }
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Could not retrieve analytics'
      });
    }
  }

  static getDashboard(req, res) {
    try {
      const analytics = AnalyticsService.getAnalytics();
      
      // Safely access nested properties with defaults
      const totalUploads = analytics.totalUploads || 0;
      const avgUploadsPerDay = analytics.insights?.avgUploadsPerDay || 0;
      const topMood = analytics.insights?.topMood || 'none';
      const topPhotoType = analytics.insights?.topPhotoType || 'none';
      
      const photoTypes = analytics.photoTypes || {};
      const moods = analytics.moods || {};
      const timeOfDay = analytics.timeOfDay || {};
      const last7Days = analytics.insights?.last7Days || [];
      
      // Create simple dashboard HTML
      const dashboardHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Moodify Analytics Dashboard</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .dashboard { max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
            .stat-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
            .stat-label { color: #666; margin-top: 5px; }
            .chart { margin: 20px 0; }
            .bar { background: #667eea; height: 20px; margin: 5px 0; border-radius: 3px; }
            .empty-state { text-align: center; color: #666; padding: 40px; }
          </style>
        </head>
        <body>
          <div class="dashboard">
            <div class="header">
              <h1>🎵 Moodify Analytics</h1>
              <p>App usage insights and statistics</p>
            </div>
            
            ${totalUploads === 0 ? `
              <div class="empty-state">
                <h2>No Data Yet</h2>
                <p>Upload some photos to see analytics data!</p>
              </div>
            ` : `
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${totalUploads}</div>
                  <div class="stat-label">Total Photo Uploads</div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-number">${avgUploadsPerDay}</div>
                  <div class="stat-label">Average Per Day</div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-number">${topMood}</div>
                  <div class="stat-label">Most Common Mood</div>
                </div>
                
                <div class="stat-card">
                  <div class="stat-number">${topPhotoType}</div>
                  <div class="stat-label">Top Photo Type</div>
                </div>
              </div>

              ${Object.keys(photoTypes).length > 0 ? `
                <div class="stat-card chart">
                  <h3>Photo Types</h3>
                  ${Object.entries(photoTypes).map(([type, count]) => `
                    <div>
                      ${type}: ${count}
                      <div class="bar" style="width: ${Math.max(...Object.values(photoTypes)) > 0 ? (count / Math.max(...Object.values(photoTypes)) * 100) : 0}%"></div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              ${Object.keys(moods).length > 0 ? `
                <div class="stat-card chart">
                  <h3>Mood Distribution</h3>
                  ${Object.entries(moods).map(([mood, count]) => `
                    <div>
                      ${mood}: ${count}
                      <div class="bar" style="width: ${Math.max(...Object.values(moods)) > 0 ? (count / Math.max(...Object.values(moods)) * 100) : 0}%"></div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              ${Object.keys(timeOfDay).length > 0 ? `
                <div class="stat-card chart">
                  <h3>Usage by Time of Day</h3>
                  ${Object.entries(timeOfDay).map(([time, count]) => `
                    <div>
                      ${time}: ${count}
                      <div class="bar" style="width: ${Math.max(...Object.values(timeOfDay)) > 0 ? (count / Math.max(...Object.values(timeOfDay)) * 100) : 0}%"></div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              ${last7Days.length > 0 ? `
                <div class="stat-card">
                  <h3>Last 7 Days</h3>
                  ${last7Days.map(day => `
                    <div>${day.date}: ${day.uploads} uploads</div>
                  `).join('')}
                </div>
              ` : ''}
            `}
          </div>
        </body>
        </html>
      `;
      
      res.send(dashboardHTML);
    } catch (error) {
      console.error('Dashboard error:', error);
      
      // Send a simple error page instead of crashing
      res.status(500).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>Dashboard Error</h1>
            <p>Could not load analytics data.</p>
            <p>Error: ${error.message}</p>
            <p>Make sure MongoDB is connected and try uploading a photo first.</p>
            <a href="/">← Back to App</a>
          </body>
        </html>
      `);
    }
  }
}

module.exports = AnalyticsController;