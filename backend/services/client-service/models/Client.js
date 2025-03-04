const mongoose = require("mongoose");
const ClientSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  type: {
    type: String,
    enum: ["Child", "FosterFamily"],
    required: true,
  },
  personalInfo: {
    name: { type: String, required: true },
    age: { type: Number },
    contactInfo: {
      address: String,
      phone: String,
      email: String,
    },
    emergencyContacts: [
      {
        name: String,
        relationship: String,
        phone: String,
      },
    ],
  },
  caseDetails: {
    caseStatus: {
      type: String,
      enum: ["Active", "Pending", "Closed"],
      default: "Active",
    },
    sessionHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
      },
    ],

    assignedCaseWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    startDate: Date,
    notes: [
      {
        content: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },

  additionalDetails: {
    // Specific details for Child or FosterFamily
    childSpecific: {
      schoolInfo: String,
      specialNeeds: [String],
    },
    fosterFamilySpecific: {
      licensingStatus: String,
      maxCapacity: Number,
    },
  },
});

module.exports = mongoose.model("Client", ClientSchema);
