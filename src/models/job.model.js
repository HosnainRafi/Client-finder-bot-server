// src/models/job.model.js
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    link: { type: String, required: true, unique: true },
    description: { type: String },
    isMatch: { type: Boolean, default: false },
    matchReasoning: { type: String },
    status: {
      type: String,
      enum: [
        "unprocessed",
        "processed",
        "applied",
        "application_failed",
        "error",
      ],
      default: "unprocessed",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
