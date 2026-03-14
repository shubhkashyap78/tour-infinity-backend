const express = require("express");
const { subscribe, listSubscribers } = require("../controllers/newsletterController");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const { requireDb } = require("../middleware/requireDb");

const router = express.Router();

router.post("/subscribe", requireDb, subscribe);
router.get("/", requireDb, auth, requireRole(["admin"]), listSubscribers);

module.exports = router;
