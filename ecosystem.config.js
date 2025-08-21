module.exports = {
    apps: [{
      name: 'tg-wa-bridge',
      script: 'telegram-to-wa.js',
      env: { NODE_ENV: 'production' },
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }]
  };
  