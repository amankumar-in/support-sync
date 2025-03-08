const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const AWS = require("aws-sdk");
// If you're on Node < 18, install node-fetch and uncomment:
// const fetch = require("node-fetch");

const AITraining = require("../models/AITraining");
const { processAndStoreEmbeddings } = require("../utils/embeddingProcessor");

const router = express.Router();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

const s3 = new AWS.S3();

// Debug AWS credentials
console.log("AI Training - AWS Config - Region:", process.env.AWS_REGION);
console.log("AI Training - AWS Config - Bucket:", process.env.S3_BUCKET_NAME);
console.log(
  "AI Training - AWS Access Key ID starts with:",
  process.env.AWS_ACCESS_KEY_ID
    ? process.env.AWS_ACCESS_KEY_ID.substring(0, 5) + "..."
    : "undefined",
);

// Create local uploads directory for temporary storage
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created uploads directory:", uploadDir);
}

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

// Function to upload file to S3 and return the key
const uploadToS3 = async (file) => {
  try {
    console.log("Uploading training file to S3:", file.path);

    const fileContent = fs.readFileSync(file.path);
    const fileName = path.basename(file.path);
    const key = `training-files/${fileName}`;

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: file.mimetype || "application/octet-stream",
    };

    const result = await s3.upload(params).promise();
    console.log("Training file uploaded to S3:", result.Key);

    // Delete local file after successful upload
    fs.unlinkSync(file.path);
    console.log("Deleted local file:", file.path);

    return result.Key;
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
};

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

    // Upload files to S3
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      console.log(`Uploading ${req.files.length} files to S3`);

      for (const file of req.files) {
        try {
          const s3Key = await uploadToS3(file);
          uploadedFiles.push({
            filename: file.originalname,
            path: s3Key,
          });
        } catch (error) {
          console.error(
            `Error uploading file ${file.originalname} to S3:`,
            error,
          );
          // Continue with other files even if one fails
        }
      }
    }

    // Save AITraining entry
    const aiTraining = new AITraining({
      organizationId: objectId, // Use the actual _id
      instructions,
      files: uploadedFiles,
    });
    await aiTraining.save();

    // Process & store embeddings in Pinecone
    await processAndStoreEmbeddings(objectId, uploadedFiles);

    res.json({
      message: "Training data uploaded and processed successfully.",
      filesUploaded: uploadedFiles.length,
    });
  } catch (error) {
    console.error("❌ AI Training Upload Error:", error);
    res
      .status(500)
      .json({ error: "Server error while uploading training data." });
  }
});

// Get a file from S3
router.get("/file/:filename", async (req, res) => {
  try {
    const { filename } = req.params;

    // Find the training entry that has this filename
    const training = await AITraining.findOne({
      "files.filename": filename,
    });

    if (!training) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get the file entry
    const fileEntry = training.files.find((f) => f.filename === filename);

    if (!fileEntry || !fileEntry.path) {
      return res.status(404).json({ error: "File path not found" });
    }

    // Generate a signed URL
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileEntry.path,
      Expires: 60 * 5, // 5 minutes
    };

    s3.getSignedUrl("getObject", params, (err, url) => {
      if (err) {
        console.error("Error generating signed URL:", err);
        return res.status(500).json({ error: "Error retrieving file" });
      }

      res.json({ fileUrl: url });
    });
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({ error: "Server error" });
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

    // Delete files from S3
    if (trainingEntry.files && trainingEntry.files.length > 0) {
      for (const file of trainingEntry.files) {
        if (file.path) {
          try {
            const params = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: file.path,
            };

            await s3.deleteObject(params).promise();
            console.log(`Deleted S3 object: ${file.path}`);
          } catch (s3Error) {
            console.error(`Error deleting S3 object ${file.path}:`, s3Error);
            // Continue with deletion even if S3 deletion fails
          }
        }
      }
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
