require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors()); // ✅ Move CORS to the top

const connectDB = require("./config/db");
const aiTrainingRoutes = require("./routes/aiTrainingRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/ai-training", aiTrainingRoutes);
app.use("/api/chatbot", chatbotRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Chatbot Service is running...");
});

// Start server
const PORT = process.env.PORT || 5010;
app.listen(PORT, () => {
  console.log(`Chatbot Service is running on port ${PORT}`);
});
