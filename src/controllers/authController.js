const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ sub: user._id, role: user.role }, secret, { expiresIn });
};

const seedAdmin = async (req, res) => {
  try {
    const existing = await User.countDocuments();
    if (existing > 0) return res.status(400).json({ message: "Admin already exists" });

    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email, and password are required" });

    const admin = await User.create({ name, email, password, role: "admin" });
    const token = signToken(admin);
    return res.status(201).json({ token, user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: "Name, email, password, and role are required" });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({ name, email, password, role });
    return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const devResetPassword = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production")
      return res.status(403).json({ message: "Not allowed" });

    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const normalized = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalized });
    if (!user) {
      user = await User.create({ name: "Admin", email: normalized, password, role: "admin" });
    } else {
      user.password = password;
      await user.save();
    }

    return res.json({ message: "Password set", email: normalized });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { seedAdmin, login, me, createUser, devResetPassword, listUsers };
