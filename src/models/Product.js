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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
