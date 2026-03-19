const Enquiry = require("../models/Enquiry");

const submitEnquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !email || !message)
      return res.status(400).json({ message: "Name, email and message are required" });

    const enquiry = await Enquiry.create({ name, email, phone, subject, message });
    return res.status(201).json({ message: "Enquiry submitted successfully", ref: enquiry.enquiryRef });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const listEnquiries = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 });
    return res.json(enquiries);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!enquiry) return res.status(404).json({ message: "Not found" });
    return res.json(enquiry);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { submitEnquiry, listEnquiries, updateEnquiry, deleteEnquiry };
