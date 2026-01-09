/**
 * Keep-Alive Service for Render Free Tier
 * Pings the health endpoint every 14 minutes to prevent cold starts
 */

const https = require('https');
const http = require('http');

let pingInterval = null;

/**
 * Start the keep-alive ping service
 * @param {string} healthUrl - Full URL to health endpoint (e.g., https://your-app.onrender.com/health)
 */
const startKeepAlive = (healthUrl) => {
  if (!healthUrl) {
    console.log('⚠️ Keep-alive disabled: No RENDER_EXTERNAL_URL set');
    return;
  }

  // Ping every 14 minutes (before Render's 15-min timeout)
  const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes

  const ping = () => {
    const protocol = healthUrl.startsWith('https') ? https : http;
    
    const req = protocol.get(healthUrl, (res) => {
      console.log(`🏓 Keep-alive ping: ${res.statusCode}`);
    });

    req.on('error', (err) => {
      console.log(`⚠️ Keep-alive ping failed: ${err.message}`);
    });

    req.end();
  };

  // Initial ping after 1 minute (give server time to start)
  setTimeout(() => {
    ping();
    pingInterval = setInterval(ping, PING_INTERVAL);
    console.log('✅ Keep-alive service started (14-min interval)');
  }, 60000);
};

const stopKeepAlive = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    console.log('🛑 Keep-alive service stopped');
  }
};

module.exports = { startKeepAlive, stopKeepAlive };
