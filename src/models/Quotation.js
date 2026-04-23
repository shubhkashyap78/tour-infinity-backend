const mongoose = require("mongoose");

const quotationItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["hotel", "tour", "package", "vehicle", "other"],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: String,
  duration: String,
  
  // Pricing details
  basePrice: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  nights: Number, // For hotels
  rooms: Number, // For hotels - number of rooms
  pax: Number, // Number of people
  
  // Date details
  checkIn: Date,
  checkOut: Date,
  serviceDate: Date,
  
  // Calculations
  subtotal: {
    type: Number,
    required: true
  },
  
  // Additional details
  inclusions: [String],
  exclusions: [String],
  notes: String
});

const quotationSchema = new mongoose.Schema({
  quotationRef: {
    type: String,
    unique: true,
    default: function() {
      return `QUOT${Date.now().toString().slice(-4)}`;
    }
  },
  
  // Lead reference
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true
  },
  
  // Customer details (copied from lead)
  customerName: {
    type: String,
    required: true
  },
  email: String,
  phone: {
    type: String,
    required: true
  },
  
  // Trip details
  packageType: String,
  destination: String,
  travelDates: {
    startDate: Date,
    endDate: Date
  },
  duration: String,
  groupSize: {
    adults: { type: Number, default: 2 },
    children: { type: Number, default: 0 },
    infants: { type: Number, default: 0 }
  },
  
  // Quotation items
  items: [quotationItemSchema],
  
  // Pricing breakdown
  pricing: {
    subtotal: { type: Number, default: 0 },
    agentMarkup: { type: Number, default: 0 }, // Amount
    agentMarkupPercent: { type: Number, default: 0 }, // Percentage
    discount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 5 }, // GST
    total: { type: Number, default: 0 }
  },
  
  // Status and workflow
  status: {
    type: String,
    enum: ["Draft", "Sent", "Viewed", "Accepted", "Rejected", "Expired"],
    default: "Draft"
  },
  version: {
    type: Number,
    default: 1
  },
  
  // Validity
  validTill: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
  },
  
  // Terms and conditions
  inclusions: [String],
  exclusions: [String],
  terms: [String],
  notes: String,
  
  // Agent details
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Tracking
  sentAt: Date,
  viewedAt: Date,
  respondedAt: Date,
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
quotationSchema.index({ leadId: 1, version: -1 });
quotationSchema.index({ quotationRef: 1 });
quotationSchema.index({ status: 1, createdAt: -1 });
quotationSchema.index({ validTill: 1 });

// Calculate totals before saving
quotationSchema.pre('save', function(next) {
  // Calculate subtotal from items
  this.pricing.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Calculate markup
  const markupAmount = this.pricing.agentMarkupPercent > 0 
    ? (this.pricing.subtotal * this.pricing.agentMarkupPercent / 100)
    : this.pricing.agentMarkup;
  
  // Calculate discount
  const discountAmount = this.pricing.discountPercent > 0
    ? (this.pricing.subtotal * this.pricing.discountPercent / 100)
    : this.pricing.discount;
  
  // Calculate taxes
  const taxableAmount = this.pricing.subtotal + markupAmount - discountAmount;
  const taxAmount = taxableAmount * this.pricing.taxPercent / 100;
  
  // Final total
  this.pricing.total = taxableAmount + taxAmount;
  this.pricing.taxes = taxAmount;
  
  next();
});

// Create new version when quotation is modified
quotationSchema.methods.createNewVersion = function() {
  const newQuotation = new this.constructor(this.toObject());
  newQuotation._id = new mongoose.Types.ObjectId();
  newQuotation.version = this.version + 1;
  newQuotation.status = "Draft";
  newQuotation.sentAt = undefined;
  newQuotation.viewedAt = undefined;
  newQuotation.respondedAt = undefined;
  newQuotation.isNew = true;
  return newQuotation;
};

module.exports = mongoose.model("Quotation", quotationSchema);