const mongoose = require("mongoose");

const inclusionExclusionSchema = new mongoose.Schema({
  type: { type: String, enum: ["inclusion", "exclusion"], required: true },
  text: { type: String, required: true, trim: true },
  category: { type: String, default: "general", trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("InclusionExclusion", inclusionExclusionSchema);
