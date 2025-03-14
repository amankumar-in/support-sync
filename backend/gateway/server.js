const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables based on NODE_ENV
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(morgan("dev")); // Logging
app.use(express.json()); // Parse JSON bodies

// CORS configuration
app.use(
  cors({
    origin: [
      "https://supportsync.co",
      "http://supportsync-frontend-js-01.s3-website-us-east-1.amazonaws.com",
      process.env.FRONTEND_URL,
    ],

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Gateway is running" });
});

// Proxy Middleware Configuration
const authServiceProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/auth": "/api/auth", // Generic rewrite for all auth routes
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(
      "=================== GATEWAY AUTH PROXY DEBUG ===================",
    );
    console.log(`Original Request Method: ${req.method}`);
    console.log(`Original URL: ${req.originalUrl}`);
    console.log(`Proxy Path: ${proxyReq.path}`);
    console.log(`Request Headers: ${JSON.stringify(req.headers)}`);
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
    console.log(
      "==============================================================",
    );

    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Proxy Response Status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error("Proxy Error Details:", err);
  },
});

const transcriptionServiceProxy = createProxyMiddleware({
  target: process.env.TRANSCRIPTION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/sessions": "/api/sessions", // Generic rewrite for transcription routes
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(
      "=================== GATEWAY TRANSCRIPTION PROXY DEBUG ===================",
    );
    console.log(`Original Request Method: ${req.method}`);
    console.log(`Original URL: ${req.originalUrl}`);
    console.log(`Proxy Path: ${proxyReq.path}`);
    console.log(`Request Headers: ${JSON.stringify(req.headers)}`);
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
    console.log(
      "==============================================================",
    );

    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Transcription Proxy Response Status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error("Transcription Proxy Error Details:", err);
  },
});

const clientServiceProxy = createProxyMiddleware({
  target: process.env.CLIENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/clients": "/api/clients", // Generic rewrite for client routes
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(
      "=================== GATEWAY CLIENT PROXY DEBUG ===================",
    );
    console.log(`Original Request Method: ${req.method}`);
    console.log(`Original URL: ${req.originalUrl}`);
    console.log(`Proxy Path: ${proxyReq.path}`);
    console.log(`Request Headers: ${JSON.stringify(req.headers)}`);
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
    console.log(
      "==============================================================",
    );

    // This is the key part that handles POST body data properly
    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Client Proxy Response Status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error("Client Proxy Error Details:", err);
  },
});

const chatbotServiceProxy = createProxyMiddleware({
  target: process.env.CHATBOT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/chatbot": "/api/chatbot", // Generic rewrite for chatbot routes
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(
      "=================== GATEWAY CHATBOT PROXY DEBUG ===================",
    );
    console.log(`Original Request Method: ${req.method}`);
    console.log(`Original URL: ${req.originalUrl}`);
    console.log(`Proxy Path: ${proxyReq.path}`);
    console.log(`Content-Type: ${req.headers["content-type"] || "none"}`);

    // Only attempt to rewrite the body for JSON requests
    if (
      req.method === "POST" &&
      req.headers["content-type"] &&
      req.headers["content-type"].includes("application/json") &&
      req.body
    ) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
    // For multipart/form-data, no additional processing is needed as http-proxy-middleware
    // handles this case correctly by default
    console.log(
      "==============================================================",
    );
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Chatbot Proxy Response Status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error("Chatbot Proxy Error Details:", err);
  },
});

// Routes
app.use("/api/auth", authServiceProxy);
app.use("/api/chatbot", chatbotServiceProxy);
app.use("/api/clients", clientServiceProxy);
app.use("/api/sessions", transcriptionServiceProxy);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong on the gateway",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(
    `Gateway running on port ${PORT} in ${process.env.NODE_ENV} mode`,
  );
  console.log(`Auth Service: ${process.env.AUTH_SERVICE_URL}`);
  console.log(
    `Transcription Service: ${process.env.TRANSCRIPTION_SERVICE_URL}`,
  );
  console.log(`Client Service: ${process.env.CLIENT_SERVICE_URL}`);
  console.log(`Chatbot Service: ${process.env.CHATBOT_SERVICE_URL}`);
  console.log("Proxying /api/auth to:", process.env.AUTH_SERVICE_URL);
});
