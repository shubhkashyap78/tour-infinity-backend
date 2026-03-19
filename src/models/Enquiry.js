const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    enquiryRef: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    subject: { type: String, default: "General Enquiry" },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

enquirySchema.pre("save", function (next) {
  if (!this.enquiryRef) {
    this.enquiryRef = "ENQ" + Date.now().toString(36).toUpperCase();
  }
  next();
});

module.exports = mongoose.model("Enquiry", enquirySchema);
