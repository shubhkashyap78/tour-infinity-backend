const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, unique: true },
    
    // Quotation reference
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation" },
    quotationRef: { type: String },
    
    // Lead reference
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productType: { type: String, enum: ["hotel", "tour", "package", "vehicle"], required: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerPhone: { type: String, default: "" },
    guests: { type: Number, default: 1 },
    checkIn: { type: Date },
    checkOut: { type: Date },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    notes: { type: String, default: "" },
    
    // Created by admin
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Auto-generate bookingRef before save
bookingSchema.pre("save", function (next) {
  if (!this.bookingRef) {
    this.bookingRef = "BK" + Date.now().toString(36).toUpperCase();
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
