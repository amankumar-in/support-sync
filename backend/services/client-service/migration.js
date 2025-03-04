// Example migration script (create as a separate file)
const mongoose = require("mongoose");
const Client = require("./models/Client");

mongoose.connect("mongodb://localhost:27017/supportsync-client");

async function migrateClients() {
  // Default organization ID to use (replace with real ID)
  const defaultOrgId = "67c35935485bfd1c33cf4679";

  try {
    // Update all clients that don't have an organization
    const result = await Client.updateMany(
      { organization: { $exists: false } },
      { $set: { organization: defaultOrgId } },
    );

    console.log(`Updated ${result.nModified} clients`);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    mongoose.disconnect();
  }
}

migrateClients();
