console.log("Starting gateway server.js, __filename:", __filename);
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS - this will allow requests from both your S3 website and localhost
app.use(
  cors({
    origin: [
      "http://supportsync-frontend-js-01.s3-website-us-east-1.amazonaws.com",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Proxy middleware
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: "http://localhost:5007",
    changeOrigin: true,
  }),
);

app.use(
  "/api/transcription",
  createProxyMiddleware({
    target: "http://localhost:5008",
    changeOrigin: true,
  }),
);

app.use(
  "/api/client",
  createProxyMiddleware({
    target: "http://localhost:5009",
    changeOrigin: true,
  }),
);

app.use(
  "/api/chatbot",
  createProxyMiddleware({
    target: "http://localhost:5010",
    changeOrigin: true,
  }),
);

// Add a simple health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Gateway service is running" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Gateway server running on port ${PORT}`);
});
