require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectDb } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Eastcape Booking API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/bookings", bookingRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const port = process.env.PORT || 5000;

(async () => {
  const connected = await connectDb();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${port}`);
    if (!connected) {
      // eslint-disable-next-line no-console
      console.warn("DB not connected. API routes that need DB will fail until MongoDB is configured.");
    }
  });
})();
