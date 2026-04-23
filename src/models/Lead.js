const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  leadRef: {
    type: String,
    unique: true,
    default: function() {
      return `LD${Date.now().toString().slice(-6)}`;
    }
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    enum: ["Website", "Phone Call", "WhatsApp", "Referral", "Walk-in", "Social Media"],
    default: "Website"
  },
  status: {
    type: String,
    enum: ["New", "Contacted", "Qualified", "Quoted", "Converted", "Lost"],
    default: "New"
  },
  packageType: {
    type: String,
    enum: ["Honeymoon", "Family", "Adventure", "LTC", "Group", "Corporate"],
    default: "Family"
  },
  travelDates: {
    type: Date
  },
  duration: {
    type: String,
    trim: true
  },
  groupSize: {
    type: String,
    trim: true
  },
  budget: {
    type: String,
    enum: ["Under ₹20k", "₹20k-50k", "₹50k-1L", "₹1L-2L", "Above ₹2L"],
    default: "₹50k-1L"
  },
  destination: {
    type: String,
    default: "Port Blair + Havelock"
  },
  requirements: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  followUpDate: {
    type: Date
  },
  lastContactDate: {
    type: Date
  },
  convertedBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better search performance
leadSchema.index({ customerName: "text", email: "text", phone: "text" });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ source: 1 });
leadSchema.index({ travelDates: 1 });

// Update lastContactDate when status changes
leadSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'New') {
    this.lastContactDate = new Date();
  }
  next();
});

module.exports = mongoose.model("Lead", leadSchema);