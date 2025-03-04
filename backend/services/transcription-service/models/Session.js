const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  clientName: { type: String, default: "No name" },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" }, // Add this line

  sessionLength: { type: Number, required: true },
  caseWorker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  caseWorkerName: { type: String },
  tags: [{ type: String }],
  keyNote: { type: String },
  date: { type: Date, default: Date.now },
  organizationId: { type: String, required: true },
  audioFilePath: { type: String }, // ✅ Store audio file path
  transcription: { type: String }, // ✅ Store Whisper AI transcription
});

module.exports = mongoose.model("Session", sessionSchema);
