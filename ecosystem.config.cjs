module.exports = {
  apps: [
    {
      name: 'vog-api',
      script: 'server/app.js',
      cwd: 'c:/vog_system',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
