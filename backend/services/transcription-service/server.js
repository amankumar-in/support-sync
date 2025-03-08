const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env vars
dotenv.config();

// Import routes
const sessionRoutes = require("./routes/sessionRoutes");

// Initialize express
const app = express();
const PORT = process.env.PORT || 5008; // Use a different port from auth service

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Mount routes
app.use("/api/sessions", sessionRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Transcription service is running" });
});
// Global error handler
app.use((err, req, res, next) => {
  console.error("Express Error:", err);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});
// Start server
app.listen(PORT, () =>
  console.log(`Transcription service running on port ${PORT}`),
);
