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
console.log("AUTH_SERVICE:", AUTH_SERVICE);
// CORS configuration remains the same
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:4000",
      "https://supportsync.co",
      "*", // Add this to allow all origins temporarily for debugging
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "*"], // Add wildcard
  }),
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Immediately after cors() and body parsing
app.use((req, res, next) => {
  console.log("🚨 CRITICAL MIDDLEWARE INTERCEPTED:", {
    method: req.method,
    url: req.url,
    path: req.path,
    body: req.body,
  });
  next();
});

// Global logging middleware to track all incoming requests
app.use((req, res, next) => {
  console.log("Global log: Received", req.method, req.url);
  // Add these lines for more details
  console.log("Request Headers:", req.headers);
  console.log("Request Body:", req.body);

  // Add a way to capture the full request details
  let data = "";
  req.on("data", (chunk) => {
    data += chunk;
  });
  req.on("end", () => {
    console.log("Raw Request Body:", data);
  });
  next();
});

app.options("*", cors());
// Updated proxy middleware with path rewriting
// Specifically for AUTH SERVICE proxy
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE, // Ensure this is correct
    changeOrigin: true,
    pathRewrite: {
      // "^/api/auth": "",
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔍 PROXY REQUEST DETAILS:`);
      console.log(`📍 Target: ${AUTH_SERVICE}`);
      console.log(`🌐 Original Path: ${req.url}`);
      console.log(`🚀 Proxied Path: ${proxyReq.path}`);

      // Log the full request details
      console.log(`🔐 Request Method: ${req.method}`);
      console.log(`🔑 Request Headers:`, req.headers);
      console.log(`📦 Request Body:`, req.body);
    },
    onError: (err, req, res) => {
      console.error(`🚨 PROXY ERROR DETAILS:`);
      console.error(`❌ Error Message: ${err.message}`);
      console.error(`🔗 Target URL: ${AUTH_SERVICE}`);
      console.error(`📍 Request URL: ${req.url}`);
      console.error(`🧨 Full Error:`, err);
    },
  }),
);

app.use(
  "/api/transcription",
  createProxyMiddleware({
    target: TRANSCRIPTION_SERVICE,
    changeOrigin: true,
  }),
);

app.use(
  "/api/client",
  createProxyMiddleware({
    target: CLIENT_SERVICE,
    changeOrigin: true,
  }),
);

app.use(
  "/api/chatbot",
  createProxyMiddleware({
    target: CHATBOT_SERVICE,
    changeOrigin: true,
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

app.post("/direct-login", (req, res) => {
  console.log("DIRECT LOGIN RECEIVED:", req.body);
  // Try to forward request manually
  const axios = require("axios");
  axios
    .post(`${AUTH_SERVICE}/login`, req.body)
    .then((response) => {
      console.log("DIRECT FORWARD SUCCESS:", response.data);
      res.json(response.data);
    })
    .catch((error) => {
      console.error("DIRECT FORWARD ERROR:", error.message);
      res.status(500).json({ error: error.message });
    });
});
