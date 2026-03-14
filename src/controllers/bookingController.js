const Booking = require("../models/Booking");
const Product = require("../models/Product");

const listBookings = async (req, res) => {
  try {
    const { status, productType, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (productType) filter.productType = productType;
    if (q) filter.customerName = { $regex: q, $options: "i" };
    const bookings = await Booking.find(filter).populate("product", "title").sort({ createdAt: -1 });
    return res.json(bookings);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("product", "title type");
    if (!booking) return res.status(404).json({ message: "Not found" });
    return res.json(booking);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const createBooking = async (req, res) => {
  try {
    const { product, customerName, customerEmail, checkIn, checkOut, totalAmount } = req.body || {};
    if (!product || !customerName || !customerEmail || !checkIn || !checkOut || !totalAmount)
      return res.status(400).json({ message: "product, customerName, customerEmail, checkIn, checkOut, totalAmount are required" });

    const prod = await Product.findById(product);
    if (!prod) return res.status(404).json({ message: "Product not found" });

    const booking = await Booking.create({ ...req.body, productType: prod.type });
    return res.status(201).json(booking);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ message: "Not found" });
    return res.json(booking);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      completedBookings,
      revenueAgg,
      byType,
      monthly,
      products,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.aggregate([
        { $match: { status: { $in: ["confirmed", "completed"] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Booking.aggregate([
        { $group: { _id: "$productType", count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
      ]),
      Booking.aggregate([
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            bookings: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
      ]),
      Product.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    return res.json({
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        cancelled: cancelledBookings,
        completed: completedBookings,
      },
      revenue: revenueAgg[0]?.total || 0,
      byType,
      monthly,
      products,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { listBookings, getBooking, createBooking, updateBooking, deleteBooking, getStats };
