const InclusionExclusion = require("../models/InclusionExclusion");

const getAll = async (req, res) => {
  try {
    const items = await InclusionExclusion.find().sort({ type: 1, createdAt: -1 });
    res.json(items);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

const create = async (req, res) => {
  try {
    const { type, text, category } = req.body;
    if (!type || !text) return res.status(400).json({ message: "type and text are required" });
    const item = await InclusionExclusion.create({ type, text, category });
    res.status(201).json(item);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

const update = async (req, res) => {
  try {
    const item = await InclusionExclusion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

const remove = async (req, res) => {
  try {
    const item = await InclusionExclusion.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { getAll, create, update, remove };
