const mongoose = require("mongoose");

const AITrainingSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  instructions: { type: String },
  files: [
    {
      filename: String,
      path: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AITraining", AITrainingSchema);
