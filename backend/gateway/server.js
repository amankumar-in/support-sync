const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Proxy configuration
const authServiceProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/auth": "/api/auth",
  },
});

// Routes
app.use("/api/auth", authServiceProxy);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "API Gateway is running" });
});

// Start server
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
