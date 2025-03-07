// This is missing at the top of your file
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const express = require("express");
const User = require("../models/User");
const Organization = require("../models/Organization");
const { v4: uuidv4 } = require("uuid"); // Generate unique organization IDs

const router = express.Router();

// ✅ REGISTER A USER
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, organizationName, role } =
      req.body;

    console.log("🔍 Registering user:", {
      firstName,
      lastName,
      email,
      organizationName,
      role,
    });

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Organization handling
    let organization = await Organization.findOne({ name: organizationName });
    let systemRole = "caseworker";
    let organizationId;

    if (!organization) {
      organizationId = uuidv4();
      organization = new Organization({
        name: organizationName,
        uniqueIdentifier: organizationId,
      });
      await organization.save();
      systemRole = "admin";
    } else {
      organizationId = organization.uniqueIdentifier;
    }

    // Use the exact same hash method that worked
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Create user directly without new User()
    await User.create({
      firstName,
      lastName,
      email,
      password: hash,
      role,
      systemRole,
      organizationId,
      createdAt: new Date(),
    });
    console.log(
      `✅ User created: ${firstName} ${lastName} (${email}) with role ${systemRole} in organization ${organizationId}`,
    );

    console.log(
      `✅ New user registered as ${systemRole} in ${organizationName} (ID: ${organizationId})`,
    );
    res.status(201).json({
      message: "User registered successfully",
      systemRole,
      organizationId,
    });
  } catch (err) {
    console.error("🔥 Registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ LOGIN A USER
router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN REQUEST BODY:", req.body);
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(400).json({ message: "User not found" });
    }

    console.log("✅ User found with ID:", user._id);
    console.log("✅ Password field length:", user.password.length);
    console.log("✅ First 10 chars of hash:", user.password.substring(0, 10));

    // Use sync method that worked before
    const isMatch = bcrypt.compareSync(password, user.password);
    console.log("🔍 Password Match Result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password does not match");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.systemRole,
        organizationId: user.organizationId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    console.log("✅ Login successful, token generated");
    res.json({
      token,
      userId: user._id.toString(), // Add this line
      role: user.systemRole,
      organizationId: user.organizationId,
    });
  } catch (err) {
    console.error("🔥 Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ ADD A USER (Admins Can Add New Users)
const mongoose = require("mongoose");

router.post("/add-user", async (req, res) => {
  try {
    const { adminId, firstName, lastName, email, password, role, systemRole } =
      req.body;

    console.log("🆔 Received adminId:", adminId);

    const adminUser = await User.findById(new mongoose.Types.ObjectId(adminId));

    if (!adminUser || adminUser.systemRole !== "admin") {
      console.log("❌ Unauthorized attempt to add user");
      return res
        .status(403)
        .json({ message: "Unauthorized: Only admins can add users." });
    }

    // Validate systemRole
    const validSystemRole =
      systemRole === "admin" || systemRole === "caseworker"
        ? systemRole
        : "caseworker"; // Default to caseworker if invalid

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hash,
      role,
      systemRole: validSystemRole,
      organizationId: adminUser.organizationId,
      createdAt: new Date(),
    });

    console.log(`✅ New user added: ${firstName} ${lastName} (${role})`);
    res.status(201).json({ message: "User added successfully", user: newUser });
  } catch (err) {
    console.error("🔥 Error adding user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Fetch all users in the admin's organization
router.get("/users/:adminId", async (req, res) => {
  try {
    const { adminId } = req.params;

    // Find admin user
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.systemRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only admins can view users." });
    }

    // Fetch all users in the same organization
    const users = await User.find({
      organizationId: adminUser.organizationId,
    }).select("-password");

    res.status(200).json(users);
  } catch (err) {
    console.error("🔥 Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update user details (Admin only)
router.put("/update-user/:userId", async (req, res) => {
  try {
    const { adminId, firstName, lastName, email, role } = req.body;
    const { userId } = req.params;

    // Find admin user
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.systemRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only admins can update users." });
    }

    // Update user details
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, email, role },
      { new: true },
    ).select("-password"); // Don't return password for security

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("🔥 Error updating user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete a user (Admin only)
router.delete("/delete-user/:userId", async (req, res) => {
  try {
    const { adminId } = req.body;
    const { userId } = req.params;

    // Find admin user
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.systemRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized: Only admins can delete users." });
    }

    // Prevent admins from deleting themselves
    if (adminId === userId) {
      return res.status(400).json({ message: "You cannot delete yourself." });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("🔥 Error deleting user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user info by ID
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by ID
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user info
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user info:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Lookup organization by uniqueIdentifier
router.get("/organizations/lookup/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    const org = await Organization.findOne({ uniqueIdentifier: identifier });
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    // Return just the _id
    res.json({ _id: org._id.toString() });
  } catch (error) {
    console.error("Error in /organizations/lookup:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; // ✅ Correctly export the router
