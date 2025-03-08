require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const mongoose = require("mongoose");
const multer = require("multer");
const AWS = require("aws-sdk");

const Session = require("../models/Session");
const User = require("../models/User");

const router = express.Router();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

const s3 = new AWS.S3();

// Debug AWS credentials
console.log("AWS Config - Region:", process.env.AWS_REGION);
console.log("AWS Config - Bucket:", process.env.S3_BUCKET_NAME);
console.log(
  "AWS Access Key ID starts with:",
  process.env.AWS_ACCESS_KEY_ID
    ? process.env.AWS_ACCESS_KEY_ID.substring(0, 5) + "..."
    : "undefined",
);
console.log(
  "AWS Secret Access Key set:",
  process.env.AWS_SECRET_ACCESS_KEY ? "Yes" : "No",
);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created uploads directory:", uploadDir);
}

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Function to upload file to S3 and return the key
const uploadToS3 = async (file) => {
  try {
    console.log("Uploading file to S3:", file.path);

    const fileContent = fs.readFileSync(file.path);
    const fileName = path.basename(file.path);
    const key = `audio-recordings/${fileName}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: file.mimetype || "audio/wav",
    };

    const result = await s3.upload(params).promise();
    console.log("File uploaded to S3:", result.Key);

    // Delete local file after successful upload
    fs.unlinkSync(file.path);
    console.log("Deleted local file:", file.path);

    return result.Key;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
};

// Test AWS connection
console.log("Testing S3 connection...");
s3.listBuckets((err, data) => {
  if (err) {
    console.error("S3 CONNECTION ERROR:", err);
  } else {
    console.log("S3 CONNECTION SUCCESS! Available buckets:");
    data.Buckets.forEach((bucket) => {
      console.log(`- ${bucket.Name}`);
      if (bucket.Name === process.env.S3_BUCKET_NAME) {
        console.log(`✅ Found target bucket: ${process.env.S3_BUCKET_NAME}`);
      }
    });
  }
});

// Test upload endpoint
router.post("/test-upload", upload.single("audio"), async (req, res) => {
  try {
    console.log("Test upload endpoint hit");
    console.log("Headers:", req.headers);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File received locally:", req.file);

    // Upload file to S3
    const s3Key = await uploadToS3(req.file);

    res.json({
      success: true,
      message: "File uploaded to S3 successfully",
      key: s3Key,
    });
  } catch (error) {
    console.error("Test upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new session with audio & transcription
router.post("/", upload.single("audio"), async (req, res) => {
  try {
    console.log("Creating new session with body:", req.body);
    console.log("File upload info:", req.file);

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

    // Convert sessionLength to Number
    sessionLength = Number(sessionLength);
    if (isNaN(sessionLength)) {
      return res.status(400).json({ message: "Invalid session length" });
    }

    // Convert caseWorker to ObjectId if valid
    if (mongoose.Types.ObjectId.isValid(caseWorker)) {
      caseWorker = new mongoose.Types.ObjectId(caseWorker);
    } else {
      caseWorker = null;
    }

    // Parse tags if it's a JSON string
    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch (error) {
        tags = [];
      }
    }

    // Handle file upload to S3 if present
    let audioFilePath = null;
    if (req.file) {
      try {
        audioFilePath = await uploadToS3(req.file);
      } catch (error) {
        console.error("S3 upload error:", error);
        return res.status(500).json({ message: "Error uploading file to S3" });
      }
    }

    // Create and save session
    const session = new Session({
      clientName: clientName || "No name",
      sessionLength,
      caseWorker,
      caseWorkerName: caseWorkerName || "",
      tags: Array.isArray(tags) ? tags : [],
      keyNote: keyNote || "",
      date: date || new Date(),
      organizationId,
      audioFilePath: audioFilePath,
      transcription: "",
    });

    const savedSession = await session.save();
    console.log("Session saved to database:", savedSession._id);

    // Process audio for transcription if uploaded and OpenAI key available
    if (audioFilePath && process.env.OPENAI_API_KEY) {
      try {
        // Get the file from S3 for transcription
        const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: audioFilePath,
        };

        const s3Object = await s3.getObject(params).promise();
        console.log("S3 audio file retrieved for transcription");

        const formData = new FormData();
        formData.append("file", s3Object.Body, "recording.wav");
        formData.append("model", "whisper-1");
        formData.append("language", "en");

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

        savedSession.transcription = response.data.text;
        await savedSession.save();
        console.log("Transcription saved");

        res.status(201).json({
          message: "Session saved with transcription",
          session: savedSession,
        });
      } catch (error) {
        console.error("Transcription error:", error.message);
        res.status(201).json({
          message: "Transcription failed, but session was saved",
          session: savedSession,
        });
      }
    } else {
      res.status(201).json({
        message: "Session saved without audio or transcription",
        session: savedSession,
      });
    }
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Get all sessions for a user's organization or client
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

// Get a single session by ID
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

// Update a session
router.put("/:id([0-9a-fA-F]{24})", async (req, res) => {
  try {
    const {
      clientName,
      sessionLength,
      tags,
      keyNote,
      caseWorker,
      caseWorkerName,
      clientId,
    } = req.body;

    const updateData = {
      clientName,
      tags,
      keyNote,
    };

    if (sessionLength) {
      updateData.sessionLength = sessionLength;
    }

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

// Delete a session
router.delete("/:id([0-9a-fA-F]{24})", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Delete the associated S3 file if it exists
    if (session.audioFilePath) {
      try {
        const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: session.audioFilePath,
        };

        await s3.deleteObject(params).promise();
        console.log(`Deleted S3 object: ${session.audioFilePath}`);
      } catch (s3Error) {
        console.error("Error deleting S3 object:", s3Error);
        // Continue with session deletion even if S3 deletion fails
      }
    }

    const deletedSession = await Session.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get audio file for a session
router.get("/audio/:id([0-9a-fA-F]{24})", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session || !session.audioFilePath) {
      return res.status(404).json({ message: "Audio not found" });
    }

    // Generate a signed URL for S3 object
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: session.audioFilePath,
      Expires: 60 * 5, // URL expires in 5 minutes
    };

    s3.getSignedUrl("getObject", params, (err, url) => {
      if (err) {
        console.error("Error generating signed URL:", err);
        return res.status(500).json({ message: "Error retrieving audio" });
      }
      console.log(
        "Generated signed URL (truncated):",
        url.substring(0, 50) + "...",
      );
      res.json({ audioUrl: url });
    });
  } catch (error) {
    console.error("Error retrieving audio:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
