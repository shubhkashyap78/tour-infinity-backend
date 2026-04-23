const express = require("express");
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  convertToBooking
} = require("../controllers/leadController");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const { requireDb } = require("../middleware/requireDb");

const router = express.Router();

// All routes require authentication and database connection
router.use(requireDb);
router.use(auth);

// Get all leads with filtering and search
router.get("/", getLeads);

// Get lead statistics
router.get("/stats", getLeadStats);

// Get single lead
router.get("/:id", getLead);

// Create new lead
router.post("/", createLead);

// Update lead
router.put("/:id", updateLead);

// Convert lead to booking
router.post("/:id/convert", convertToBooking);

// Delete lead (admin only)
router.delete("/:id", requireRole(["admin"]), deleteLead);

module.exports = router;