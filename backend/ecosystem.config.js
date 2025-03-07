module.exports = {
  apps: [
    {
      name: "gateway",
      script: "./gateway/server.js",
      watch: true,
      env: {
        NODE_ENV: "development",
        PORT: 4000, // Local development
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8080, // Beanstalk production
      },
    },
    {
      name: "auth-service",
      script: "./services/auth-service/server.js",
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
      script: "./services/transcription-service/server.js",
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
      script: "./services/client-service/server.js",
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
      script: "./services/chatbot-service/server.js",
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
