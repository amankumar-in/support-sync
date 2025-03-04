require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const mongoose = require("mongoose");
const multer = require("multer");
const Session = require("../models/Session");
const User = require("../models/User");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// ✅ Create a new session with audio & transcription
router.post("/", upload.single("audio"), async (req, res) => {
  try {
    let {
      clientName,
      sessionLength,
      caseWorker,
      caseWorkerName,
      tags,
      keyNote,
      date,
      organizationId,
    } = req.body;

    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }

    // ✅ Convert sessionLength to Number
    sessionLength = Number(sessionLength);
    if (isNaN(sessionLength)) {
      return res.status(400).json({ message: "Invalid session length" });
    }

    // ✅ Convert caseWorker to ObjectId if valid
    if (mongoose.Types.ObjectId.isValid(caseWorker)) {
      caseWorker = new mongoose.Types.ObjectId(caseWorker);
    } else {
      caseWorker = null;
    }

    // ✅ Parse tags if it's a JSON string
    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch (error) {
        return res.status(400).json({ message: "Invalid tags format" });
      }
    }

    // ✅ Step 1: Save session details first (without transcription)
    // Before creating the session, prepare the file path with extension if a file exists
    let audioFilePath = null;
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      audioFilePath = `${req.file.path}${fileExtension}`;
    }

    const session = new Session({
      clientName: clientName?.replace(/^"(.*)"$/, "$1") || "No name", // ✅ Removes extra quotes
      sessionLength,
      caseWorker,
      caseWorkerName: caseWorkerName?.replace(/^"(.*)"$/, "$1") || "", // ✅ Removes extra quotes
      tags: Array.isArray(tags) ? tags : [],
      keyNote: keyNote?.replace(/^"(.*)"$/, "$1") || "", // ✅ Removes extra quotes
      date: date || new Date(),
      organizationId: organizationId?.replace(/^"(.*)"$/, "$1"), // ✅ Removes extra quotes
      audioFilePath: audioFilePath,
      transcription: "",
    });

    const savedSession = await session.save();

    // ✅ Step 2: Process audio file (if uploaded)
    if (req.file) {
      console.log("Received audio file:", req.file.path);

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const newFilePath = `${req.file.path}${fileExtension}`;
      fs.renameSync(req.file.path, newFilePath); // ✅ Rename for proper extension

      const audioFile = fs.createReadStream(newFilePath);
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "whisper-1");
      formData.append("language", "en");
      formData.append("temperature", "0");

      try {
        const response = await axios.post(
          "https://api.openai.com/v1/audio/transcriptions",
          formData,
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              ...formData.getHeaders(),
            },
          },
        );

        // ✅ Step 3: Update session with transcription result
        savedSession.transcription = response.data.text;
        await savedSession.save();

        res.status(201).json({
          message: "Session saved with transcription",
          session: savedSession,
        });
      } catch (error) {
        console.error(
          "Transcription Error:",
          error.response?.data || error.message,
        );
        res.status(500).json({
          error: "Transcription failed, but session was saved",
          session: savedSession,
        });
      }
    } else {
      res.status(201).json({
        message: "Session saved without audio",
        session: savedSession,
      });
    }
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all sessions for a user's organization or client if mentioned
router.get("/", async (req, res) => {
  try {
    const { organizationId, clientId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }

    const query = { organizationId };

    // Convert clientId to ObjectId if provided
    if (clientId) {
      query.clientId = new mongoose.Types.ObjectId(clientId);
    }

    console.log("Fetching sessions with query:", query);
    const sessions = await Session.find(query);
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get a single session by ID
router.get("/:id([0-9a-fA-F]{24})", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(200).json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update a session
// ✅ Update a session
router.put("/:id([0-9a-fA-F]{24})", async (req, res) => {
  try {
    const {
      clientName,
      sessionLength,
      tags,
      keyNote,
      caseWorker,
      caseWorkerName,
      clientId, // <--- Destructure here
    } = req.body;

    const updateData = {
      clientName,
      sessionLength,
      tags,
      keyNote,
    };

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      updateData.clientId = clientId;
    }

    if (caseWorker && mongoose.Types.ObjectId.isValid(caseWorker)) {
      updateData.caseWorker = new mongoose.Types.ObjectId(caseWorker);
    }

    if (caseWorkerName) {
      updateData.caseWorkerName = caseWorkerName;
    }

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    if (!updatedSession) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete a session
router.delete("/:id([0-9a-fA-F]{24})", async (req, res) => {
  try {
    const deletedSession = await Session.findByIdAndDelete(req.params.id);
    if (!deletedSession) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get audio file for a session
// In sessionRoutes.js

router.get("/audio/:id([0-9a-fA-F]{24})", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session || !session.audioFilePath) {
      return res.status(404).json({ message: "Audio not found" });
    }

    console.log("Current working directory:", process.cwd());
    console.log("Stored audio file path:", session.audioFilePath);

    // Try multiple path resolutions
    const possiblePaths = [
      path.resolve(session.audioFilePath),
      path.join(process.cwd(), session.audioFilePath),
      path.join(process.cwd(), "uploads", path.basename(session.audioFilePath)),
    ];

    const existingPath = possiblePaths.find(fs.existsSync);

    if (!existingPath) {
      return res.status(404).json({
        message: "Audio file not found",
        possiblePaths: possiblePaths,
        storedPath: session.audioFilePath,
      });
    }

    res.download(existingPath);
  } catch (error) {
    console.error("Error retrieving audio:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
