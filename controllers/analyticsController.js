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
          </style>
        </head>
        <body>
          <div class="dashboard">
            <div class="header">
              <h1>🎵 Moodify Analytics</h1>
              <p>App usage insights and statistics</p>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${analytics.totalUploads}</div>
                <div class="stat-label">Total Photo Uploads</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-number">${analytics.insights.avgUploadsPerDay}</div>
                <div class="stat-label">Average Per Day</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-number">${analytics.insights.topMood}</div>
                <div class="stat-label">Most Common Mood</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-number">${analytics.insights.topPhotoType}</div>
                <div class="stat-label">Top Photo Type</div>
              </div>
            </div>

            <div class="stat-card chart">
              <h3>Photo Types</h3>
              ${Object.entries(analytics.photoTypes).map(([type, count]) => `
                <div>
                  ${type}: ${count}
                  <div class="bar" style="width: ${(count / Math.max(...Object.values(analytics.photoTypes)) * 100)}%"></div>
                </div>
              `).join('')}
            </div>

            <div class="stat-card chart">
              <h3>Mood Distribution</h3>
              ${Object.entries(analytics.moods).map(([mood, count]) => `
                <div>
                  ${mood}: ${count}
                  <div class="bar" style="width: ${(count / Math.max(...Object.values(analytics.moods)) * 100)}%"></div>
                </div>
              `).join('')}
            </div>

            <div class="stat-card chart">
              <h3>Usage by Time of Day</h3>
              ${Object.entries(analytics.timeOfDay).map(([time, count]) => `
                <div>
                  ${time}: ${count}
                  <div class="bar" style="width: ${(count / Math.max(...Object.values(analytics.timeOfDay)) * 100)}%"></div>
                </div>
              `).join('')}
            </div>

            <div class="stat-card">
              <h3>Last 7 Days</h3>
              ${analytics.insights.last7Days.map(day => `
                <div>${day.date}: ${day.uploads} uploads</div>
              `).join('')}
            </div>
          </div>
        </body>
        </html>
      `;
      
      res.send(dashboardHTML);
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).send('Dashboard error');
    }
  }
}

module.exports = AnalyticsController;