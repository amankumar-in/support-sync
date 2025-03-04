const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  systemRole: {
    type: String,
    enum: ["admin", "caseworker"],
    default: "caseworker",
  },
  organizationId: { type: String, required: true }, // 🔹 Change from ObjectId to String
  createdAt: { type: Date, default: Date.now },
});

// ✅ Fix: Ensure "pre save" runs on the correct schema
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// Method to check password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
