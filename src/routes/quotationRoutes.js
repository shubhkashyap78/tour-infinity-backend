const express = require("express");
const {
  getQuotations,
  getQuotation,
  createQuotationFromLead,
  createQuotation,
  updateQuotation,
  addQuotationItem,
  removeQuotationItem,
  updateQuotationPricing,
  sendQuotation,
  getQuotationStats,
  convertQuotationToBooking,
  deleteQuotation
} = require("../controllers/quotationController");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const { requireDb } = require("../middleware/requireDb");

const router = express.Router();

// All routes require authentication and database connection
router.use(requireDb);
router.use(auth);

// Get all quotations
router.get("/", getQuotations);

// Get quotation statistics
router.get("/stats", getQuotationStats);

// Create quotation from lead
router.post("/from-lead/:leadId", createQuotationFromLead);

// Get single quotation
router.get("/:id", getQuotation);

// Create new quotation
router.post("/", createQuotation);

// Update quotation
router.put("/:id", updateQuotation);

// Add item to quotation
router.post("/:id/items", addQuotationItem);

// Remove item from quotation
router.delete("/:id/items/:itemId", removeQuotationItem);

// Update quotation pricing
router.put("/:id/pricing", updateQuotationPricing);

// Send quotation to customer
router.post("/:id/send", sendQuotation);

// Convert quotation to booking
router.post("/:id/convert-to-booking", convertQuotationToBooking);

// Delete quotation (admin only)
router.delete("/:id", requireRole(["admin"]), deleteQuotation);

module.exports = router;