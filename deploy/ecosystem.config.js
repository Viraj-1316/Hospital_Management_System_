// PM2 Ecosystem Configuration for Hostinger VPS
// Place this file in /var/www/onecare/backend/
// Run: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'onecare-backend',
      script: 'index.js',
      cwd: '/var/www/onecare/backend',
      instances: 1, // KVM1 has 1 vCPU, use 1 instance
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Log configuration
      error_file: '/var/www/onecare/logs/backend-error.log',
      out_file: '/var/www/onecare/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
