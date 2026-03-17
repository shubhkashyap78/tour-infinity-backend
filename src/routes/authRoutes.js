const express = require("express");
const { seedAdmin, login, me, createUser, devResetPassword, listUsers } = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const { requireDb } = require("../middleware/requireDb");

const router = express.Router();

router.post("/seed-admin", requireDb, seedAdmin);
router.post("/login", requireDb, login);
router.post("/dev-reset", requireDb, devResetPassword);
router.get("/me", auth, me);
router.post("/users", auth, requireRole(["admin"]), createUser);
router.get("/users", requireDb, auth, requireRole(["admin"]), listUsers);

module.exports = router;
