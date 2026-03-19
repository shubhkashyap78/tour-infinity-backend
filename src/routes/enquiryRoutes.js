const express = require("express");
const { submitEnquiry, listEnquiries, updateEnquiry, deleteEnquiry } = require("../controllers/enquiryController");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const { requireDb } = require("../middleware/requireDb");

const router = express.Router();

// Public — contact form submission
router.post("/", requireDb, submitEnquiry);

// Admin/staff — manage enquiries
const guard = [requireDb, auth, requireRole(["admin", "staff"])];
router.get("/", ...guard, listEnquiries);
router.put("/:id", ...guard, updateEnquiry);
router.delete("/:id", requireDb, auth, requireRole(["admin"]), deleteEnquiry);

module.exports = router;
