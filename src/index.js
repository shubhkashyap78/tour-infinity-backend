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
const leadRoutes = require("./routes/leadRoutes");
const quotationRoutes = require("./routes/quotationRoutes");

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "25mb" }));
app.use(morgan("dev"));

// Ensure DB connected on every request (Vercel serverless)
app.use(async (req, res, next) => {
  await connectDb();
  next();
});

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Andaman Tour Infinity API" });
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
app.use("/api/leads", leadRoutes);
app.use("/api/quotations", quotationRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5001;
connectDb().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

module.exports = app;
