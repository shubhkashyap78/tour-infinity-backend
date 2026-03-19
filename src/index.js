require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectDb } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Ensure DB connected on every request (Vercel serverless)
app.use(async (req, res, next) => {
  await connectDb();
  next();
});

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Eastcape Booking API" });
});

app.get("/health", async (req, res) => {
  const mongoose = require("mongoose");
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    db: dbState[mongoose.connection.readyState],
    mongo_uri_set: !!process.env.MONGO_URI,
    jwt_set: !!process.env.JWT_SECRET,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/enquiries", enquiryRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// Connect DB once (Vercel serverless — no app.listen)
connectDb();

module.exports = app;
