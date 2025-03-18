module.exports = {
  apps: [{
    name: "scgen-backend",
    script: "node_modules/.bin/ts-node",
    args: "src/server.ts",
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: "production",
      PORT: 3001,
      HOST: "0.0.0.0",
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
      CORS_ORIGIN: "*",  // Update this with your actual frontend domain
      SKIP_PREFLIGHT_CHECK: "true"
    }
  }]
};
