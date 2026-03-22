const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    caption: { type: String, default: "" },
  },
  { _id: false }
);

const marketPriceSchema = new mongoose.Schema(
  {
    market: { type: String, required: true },
    currency: { type: String, required: true },
    price: { type: Number, required: true },
    offerLabel: { type: String, default: "" },
  },
  { _id: false }
);

const localizedSchema = new mongoose.Schema(
  {
    locale: { type: String, required: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["hotel", "tour", "package", "vehicle"],
      required: true,
    },
    description: { type: String, default: "" },
    tags: [{ type: String }],
    media: [mediaSchema],
    inventory: {
      quantity: { type: Number, default: 0 },
      stopSales: { type: Boolean, default: false },
    },
    baseCurrency: { type: String, default: "USD" },
    basePrice: { type: Number, default: 0 },
    markets: [marketPriceSchema],
    localized: [localizedSchema],
    isActive: { type: Boolean, default: true },
    // vehicle-specific
    vehicleCapacity: { type: Number, default: 4 },
    vehicleModel: { type: String, default: "" },
    hasAC: { type: Boolean, default: true },
    luggageCapacity: { type: Number, default: 2 },
    transferPricing: {
      airportOneWay:  { type: Number, default: 0 },
      airportTwoWay:  { type: Number, default: 0 },
      hotelTransfer:  { type: Number, default: 0 },
      fullDay4hrs:    { type: Number, default: 0 },
      fullDay8hrs:    { type: Number, default: 0 },
    },
    // tour-specific
    childPricing: {
      infantPrice: { type: Number, default: 0 },
      childPrice:  { type: Number, default: 0 },
      adultPrice:  { type: Number, default: 0 },
    },
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model("Product", productSchema);
