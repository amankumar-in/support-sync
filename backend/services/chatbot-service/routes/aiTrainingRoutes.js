const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// If you’re on Node < 18, install node-fetch and uncomment:
// const fetch = require("node-fetch");

const AITraining = require("../models/AITraining");
const { processAndStoreEmbeddings } = require("../utils/embeddingProcessor");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Point this to your auth-service
const AUTH_SERVICE_URL = "http://localhost:5007/api/auth";

// GET AI Training data for a specific organization (by UUID)
router.get("/:organizationId", async (req, res) => {
  try {
    const { organizationId } = req.params; // This is the UUID from frontend

    if (!organizationId) {
      return res
        .status(400)
        .json({ error: "Organization ID (UUID) is required." });
    }

    console.log(`🔍 Looking up ObjectId for org UUID: ${organizationId}`);
    // Call auth-service
    const orgResponse = await fetch(
      `${AUTH_SERVICE_URL}/organizations/lookup/${organizationId}`,
    );
    if (!orgResponse.ok) {
      console.error(`❌ auth-service error: ${orgResponse.status}`);
      return res
        .status(500)
        .json({ error: "Error fetching organization from auth-service" });
    }

    const orgData = await orgResponse.json();
    if (!orgData._id) {
      return res.status(404).json({ error: "Organization not found." });
    }

    const objectId = orgData._id;
    console.log(`✅ Found Organization _id: ${objectId}`);

    // Query AI Training data using the ObjectId
    const trainingData = await AITraining.find({ organizationId: objectId });
    res.json(trainingData);
  } catch (error) {
    console.error("❌ Error fetching AI training data:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching training data." });
  }
});

// Upload instructions/files for a specific org (by UUID)
router.post("/", upload.array("files"), async (req, res) => {
  try {
    const { organizationId, instructions } = req.body; // orgId is still the UUID
    if (!organizationId) {
      return res
        .status(400)
        .json({ error: "Organization ID (UUID) is required." });
    }

    console.log(`🔍 Looking up ObjectId for org UUID: ${organizationId}`);
    const orgResponse = await fetch(
      `${AUTH_SERVICE_URL}/organizations/lookup/${organizationId}`,
    );
    const orgData = await orgResponse.json();

    if (!orgResponse.ok || !orgData._id) {
      return res
        .status(404)
        .json({ error: "Organization not found in auth-service." });
    }

    const objectId = orgData._id;
    console.log(`✅ Found Organization _id: ${objectId}`);

    // Prepare files
    const uploadedFiles = req.files.map((file) => ({
      filename: file.filename,
      path: file.path,
    }));

    // Save AITraining entry
    const aiTraining = new AITraining({
      organizationId: objectId, // Use the actual _id
      instructions,
      files: uploadedFiles,
    });
    await aiTraining.save();

    // Process & store embeddings in Pinecone
    await processAndStoreEmbeddings(objectId, uploadedFiles);

    res.json({ message: "Training data uploaded and processed successfully." });
  } catch (error) {
    console.error("❌ AI Training Upload Error:", error);
    res
      .status(500)
      .json({ error: "Server error while uploading training data." });
  }
});

// Delete a training entry by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const trainingEntry = await AITraining.findById(id);
    if (!trainingEntry) {
      return res.status(404).json({ error: "Training entry not found." });
    }

    await AITraining.findByIdAndDelete(id);
    res.json({ message: "Training entry deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting training entry:", error);
    res
      .status(500)
      .json({ error: "Server error while deleting training data." });
  }
});

module.exports = router;
