const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const textract = require("textract");
const { OpenAI } = require("openai");
const { Pinecone } = require("@pinecone-database/pinecone");
const AWS = require("aws-sdk");
require("dotenv").config();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

const s3 = new AWS.S3();

// Initialize OpenAI and Pinecone clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log("Created temp directory:", tempDir);
}

// Function to extract text from different file types
const extractText = async (
  filePath,
  isS3Path = false,
  originalFilename = "",
) => {
  let tempFilePath = filePath;
  let shouldCleanupTemp = false;

  try {
    // If it's an S3 path, download to temp first
    if (isS3Path) {
      console.log(`Downloading file from S3: ${filePath}`);

      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: filePath,
      };

      const s3Object = await s3.getObject(params).promise();
      tempFilePath = path.join(
        tempDir,
        path.basename(originalFilename || filePath),
      );

      // Write S3 content to temp file
      fs.writeFileSync(tempFilePath, s3Object.Body);
      shouldCleanupTemp = true;
    }

    // Determine file extension
    const ext = path.extname(originalFilename || tempFilePath).toLowerCase();
    let text = "";

    // Extract text based on file type
    if (ext === ".pdf") {
      const data = await pdfParse(fs.readFileSync(tempFilePath));
      text = data.text;
    } else if (ext === ".docx") {
      const data = await mammoth.extractRawText({ path: tempFilePath });
      text = data.value;
    } else if (ext === ".txt") {
      text = fs.readFileSync(tempFilePath, "utf-8");
    } else {
      // For other file types, use textract
      text = await new Promise((resolve, reject) => {
        textract.fromFileWithPath(tempFilePath, (error, text) => {
          if (error) reject(error);
          else resolve(text);
        });
      });
    }

    return text;
  } catch (error) {
    console.error(
      `Error extracting text from ${originalFilename || filePath}:`,
      error,
    );
    return "";
  } finally {
    // Clean up temp file if we created one
    if (shouldCleanupTemp && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`Deleted temp file: ${tempFilePath}`);
    }
  }
};

// Function to generate OpenAI embeddings
const generateEmbeddings = async (text) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
};

// Function to process files and store embeddings
const processAndStoreEmbeddings = async (organizationId, files) => {
  console.log(`Processing ${files.length} files for org ${organizationId}`);

  for (const file of files) {
    try {
      // Determine if file is in S3 or local
      const isS3Path = file.path.startsWith("training-files/");
      const text = await extractText(file.path, isS3Path, file.filename);

      if (!text) {
        console.warn(`No text extracted from ${file.filename}`);
        continue;
      }

      const embedding = await generateEmbeddings(text);

      // Store embedding in Pinecone with text in metadata
      await pineconeIndex.namespace(organizationId).upsert([
        {
          id: `${organizationId}-${file.filename}`,
          values: embedding,
          metadata: {
            organizationId: organizationId,
            filename: file.filename,
            text: text.substring(0, 4000), // Limit metadata text size
          },
        },
      ]);

      console.log(`✅ Stored embedding for: ${file.filename}`);
    } catch (error) {
      console.error(`Error processing file ${file.filename}:`, error);
    }
  }

  console.log(`✅ Successfully processed all files for org ${organizationId}`);
};

module.exports = { processAndStoreEmbeddings };
