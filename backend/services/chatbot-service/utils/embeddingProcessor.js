const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const textract = require("textract");
const { OpenAI } = require("openai");
const { Pinecone } = require("@pinecone-database/pinecone");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);

// Function to extract text from different file types
const extractText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") {
    const data = await pdfParse(fs.readFileSync(filePath));
    return data.text;
  } else if (ext === ".docx") {
    const data = await mammoth.extractRawText({ path: filePath });
    return data.value;
  } else if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  } else {
    return await textract.fromFileWithPath(filePath);
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
  for (const file of files) {
    try {
      const text = await extractText(file.path);
      const embedding = await generateEmbeddings(text);

      // ✅ Store extracted text in metadata
      await pineconeIndex.namespace(organizationId).upsert([
        {
          id: `${organizationId}-${file.filename}`,
          values: embedding,
          metadata: {
            organizationId: organizationId,
            filename: file.filename,
            text: text.substring(0, 4000),
          },
        },
      ]);

      console.log(`Stored embedding for: ${file.filename}`);
    } catch (error) {
      console.error(`Error processing file ${file.filename}:`, error);
    }
  }
};

module.exports = { processAndStoreEmbeddings };
