const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5009;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "Client service is running" });
});

const clientRoutes = require("./routes/clientRoutes");
app.use("/api/clients", clientRoutes);

app.listen(PORT, () => {
  console.log(`Client service running on port ${PORT}`);
});
