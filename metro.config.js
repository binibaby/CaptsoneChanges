const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable better support for multiple devices
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add headers to support multiple devices
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Log device connections
      if (req.url === '/status') {
        console.log(`📱 Device connected from: ${req.connection.remoteAddress}`);
      }
      
      return middleware(req, res, next);
    };
  },
  port: 8081, // Default Metro port
  host: '0.0.0.0', // Listen on all interfaces
};

// Enable better resolver for network connections
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'native', 'web'],
};

module.exports = config;
