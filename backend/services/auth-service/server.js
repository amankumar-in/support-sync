const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require("./routes/authRoutes");

// Initialize express
const app = express();
const PORT = process.env.PORT || 5007;

// Middleware
app.use(cors());
app.use(express.json());

console.log("🚨 MONGO_URI is:", process.env.MONGO_URI);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Mount routes
app.use("/api/auth", authRoutes);

app.use((req, res, next) => {
  console.log("AUTH SERVICE MIDDLEWARE");
  console.log(`Incoming Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  next();
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Auth service is running" });
});

// Start server
app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));
