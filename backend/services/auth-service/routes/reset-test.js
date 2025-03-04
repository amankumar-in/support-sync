const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Adjust path as needed

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/supportsync-auth");

    // Clear old test account if exists
    await User.deleteOne({ email: "test-direct@example.com" });

    // Create test password
    const password = "simple123";
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Create user document directly
    const newUser = {
      firstName: "Test",
      lastName: "Direct",
      email: "test-direct@example.com",
      password: hash,
      role: "Testing",
      systemRole: "admin",
      organizationId: "test-org-123",
      createdAt: new Date(),
    };

    // Insert the document
    await User.create(newUser);

    console.log("Test user created with:");
    console.log("Email: test-direct@example.com");
    console.log("Password: simple123");
    console.log("Hash:", hash);

    // Verify we can compare it
    const verifyMatch = bcrypt.compareSync("simple123", hash);
    console.log("Verification result:", verifyMatch);

    mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

createTestUser();
