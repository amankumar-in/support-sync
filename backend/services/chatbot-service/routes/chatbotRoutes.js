const express = require("express");
// If Node < 18, install node-fetch and uncomment:
// const fetch = require("node-fetch");
const { OpenAI } = require("openai");
const { Pinecone } = require("@pinecone-database/pinecone");

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);

// Point this to your auth-service
const AUTH_SERVICE_URL = "http://localhost:5007/api/auth";

router.post("/", async (req, res) => {
  try {
    let { organizationId, userId, text } = req.body;
    // NOTE: organizationId is the UUID from localStorage, not a Mongo ObjectId

    if (!organizationId || !userId || !text) {
      return res
        .status(400)
        .json({ error: "Missing organizationId, userId, or text." });
    }
    console.log(`🔍 Chatbot query for org UUID: ${organizationId}`);

    // 1) Look up the actual organization _id from auth-service
    const orgResponse = await fetch(
      `${AUTH_SERVICE_URL}/organizations/lookup/${organizationId}`,
    );
    if (!orgResponse.ok) {
      console.error(
        "❌ Organization not found in auth-service:",
        organizationId,
      );
      return res.status(400).json({
        error: "Organization not found with the provided UUID",
      });
    }
    const { _id: orgObjectId } = await orgResponse.json();
    console.log(`✅ Found org _id: ${orgObjectId} for UUID: ${organizationId}`);

    // 2) Generate an embedding for the user's query
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });

    // 3) Query Pinecone using the real org _id as the namespace (and in the filter)
    const results = await pineconeIndex.namespace(orgObjectId).query({
      vector: queryEmbedding.data[0].embedding,
      topK: 3,
      includeMetadata: true,
      filter: { organizationId: orgObjectId }, // Ensure your metadata also stored the objectId
    });

    console.log("Pinecone results:", JSON.stringify(results.matches, null, 2));

    // 4) Gather relevant text from Pinecone results
    const relevantText = results.matches
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .slice(0, 3) // up to 3 snippets
      .join("\n\n")
      .substring(0, 4000);

    // 5) Generate a chat completion with the retrieved context
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an AI trained to assist with foster care. Use the provided context. If info is missing, respond with a polite disclaimer.",
        },
        {
          role: "system",
          content: `Relevant Document Content:\n\n${relevantText}`,
        },
        { role: "user", content: text },
      ],
      temperature: 0.7,
    });

    const finalAnswer =
      aiResponse.choices[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response.";

    res.json({ response: finalAnswer });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
