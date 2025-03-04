const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  uniqueIdentifier: { type: String, required: true, unique: true }, // 🔹 Ensure unique organization ID is a string
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Organization", OrganizationSchema);
