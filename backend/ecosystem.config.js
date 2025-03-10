module.exports = {
  apps: [
    {
      name: "gateway",
      script: "./gateway/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "auth-service",
      script: "./server.js",
      cwd: "./services/auth-service",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "chatbot-service",
      script: "./server.js",
      cwd: "./services/chatbot-service",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "client-service",
      script: "./server.js",
      cwd: "./services/client-service",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "transcription-service",
      script: "./server.js",
      cwd: "./services/transcription-service",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
