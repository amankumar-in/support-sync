// In backend/gateway/server.js

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const path = require("path");

// Environment-aware service URLs
const AUTH_SERVICE = process.env.AUTH_SERVICE || "http://localhost:5007";
const TRANSCRIPTION_SERVICE =
  process.env.TRANSCRIPTION_SERVICE || "http://localhost:5008";
const CLIENT_SERVICE = process.env.CLIENT_SERVICE || "http://localhost:5009";
const CHATBOT_SERVICE = process.env.CHATBOT_SERVICE || "http://localhost:5010";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration remains the same
app.use(
  cors({
    origin: [
      "http://supportsync-frontend-js-01.s3-website-us-east-1.amazonaws.com",
      "http://localhost:3000",
      "https://supportsync.co",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Updated proxy middleware with path rewriting
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE,
    changeOrigin: true,
    pathRewrite: {
      "^/api/auth": "",
    },
  }),
);

app.use(
  "/api/transcription",
  createProxyMiddleware({
    target: TRANSCRIPTION_SERVICE,
    changeOrigin: true,
    pathRewrite: {
      "^/api/transcription": "",
    },
  }),
);

app.use(
  "/api/client",
  createProxyMiddleware({
    target: CLIENT_SERVICE,
    changeOrigin: true,
    pathRewrite: {
      "^/api/client": "",
    },
  }),
);

app.use(
  "/api/chatbot",
  createProxyMiddleware({
    target: CHATBOT_SERVICE,
    changeOrigin: true,
    pathRewrite: {
      "^/api/chatbot": "",
    },
  }),
);

// Health check route remains the same
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Gateway service is running" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Gateway server running on port ${PORT}`);
});
