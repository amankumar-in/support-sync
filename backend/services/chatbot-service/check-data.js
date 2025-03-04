const { Pinecone } = require("@pinecone-database/pinecone");
require("dotenv").config();

(async () => {
  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

    const organizationId = "65d8b2f4a1b2c3d4e5f67890"; // ✅ Replace with the actual organization ID

    console.log(`Deleting all embeddings in namespace: ${organizationId}`);
    await pineconeIndex.namespace(organizationId).deleteAll();

    console.log(
      `✅ Successfully deleted all embeddings for Organization ID: ${organizationId}`,
    );
  } catch (error) {
    console.error("❌ Error deleting Pinecone data:", error);
  }
})();
