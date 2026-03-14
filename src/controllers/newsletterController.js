const NewsletterSubscriber = require("../models/NewsletterSubscriber");

const subscribe = async (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalized = email.toLowerCase().trim();
    const existing = await NewsletterSubscriber.findOne({ email: normalized });
    if (existing) return res.status(200).json({ message: "Already subscribed" });

    await NewsletterSubscriber.create({ email: normalized, name: name || "" });
    return res.status(201).json({ message: "Subscribed" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const listSubscribers = async (req, res) => {
  try {
    const subs = await NewsletterSubscriber.find().sort({ createdAt: -1 });
    return res.json(subs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { subscribe, listSubscribers };
