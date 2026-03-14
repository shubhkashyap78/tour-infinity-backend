const mongoose = require("mongoose");

const connectDb = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    // eslint-disable-next-line no-console
    console.warn("MONGO_URI is not set. Starting server without DB connection.");
    return false;
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    // eslint-disable-next-line no-console
    console.log("MongoDB connected");
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection failed", err);
    return false;
  }
};

module.exports = { connectDb };
