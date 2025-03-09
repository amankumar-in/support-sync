Copymodule.exports = {
  apps: [
    {
      name: "gateway",
      script: "server.js",
      cwd: "./gateway",
      watch: false,
      env: {
        // Development environment
        ...require("dotenv").config({
          path: "./gateway/.env.development",
        }).parsed,
        NODE_ENV: "development",
      },
      env_production: {
        // Production environment
        ...require("dotenv").config({
          path: "./gateway/.env.production",
        }).parsed,
        NODE_ENV: "production",
      },
    },
    {
      name: "auth-service",
      script: "server.js", // relative to cwd (./services/auth-service)
      cwd: "./services/auth-service",
      watch: true,
      env: {
        ...require("dotenv").config({ path: "./services/auth-service/.env" })
          .parsed,
        NODE_ENV: "development",
        PORT: 5007,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5007,
      },
    },
    {
      name: "transcription-service",
      script: "server.js", // relative to cwd (./services/transcription-service)
      cwd: "./services/transcription-service",
      watch: true,
      env: {
        ...require("dotenv").config({
          path: "./services/transcription-service/.env",
        }).parsed,
        NODE_ENV: "development",
        PORT: 5008,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5008,
      },
    },
    {
      name: "client-service",
      script: "server.js", // relative to cwd (./services/client-service)
      cwd: "./services/client-service",
      watch: true,
      env: {
        ...require("dotenv").config({ path: "./services/client-service/.env" })
          .parsed,
        NODE_ENV: "development",
        PORT: 5009,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5009,
      },
    },
    {
      name: "chatbot-service",
      script: "server.js", // relative to cwd (./services/chatbot-service)
      cwd: "./services/chatbot-service",
      watch: true,
      env: {
        ...require("dotenv").config({ path: "./services/chatbot-service/.env" })
          .parsed,
        NODE_ENV: "development",
        PORT: 5010,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5010,
      },
    },
  ],
};
