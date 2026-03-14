const Product = require("../models/Product");

const VALID_TYPES = ["hotel", "tour", "package", "vehicle"];

const listProducts = async (req, res) => {
  try {
    const { type, q } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (q) filter.title = { $regex: q, $options: "i" };
    const products = await Product.find(filter).sort({ createdAt: -1 });
    return res.json(products);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { title, type } = req.body || {};
    if (!title || !type) return res.status(400).json({ message: "title and type are required" });
    if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(", ")}` });
    const product = await Product.create(req.body);
    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
    if (!product) return res.status(404).json({ message: "Not found" });
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const duplicateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    const clone = product.toObject();
    delete clone._id;
    clone.title = `${clone.title} (Copy)`;
    const newProduct = await Product.create(clone);
    return res.status(201).json(newProduct);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateInventory = async (req, res) => {
  try {
    const { quantity, stopSales } = req.body || {};
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    if (typeof quantity === "number") product.inventory.quantity = quantity;
    if (typeof stopSales === "boolean") product.inventory.stopSales = stopSales;
    await product.save();
    return res.json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, duplicateProduct, updateInventory };
