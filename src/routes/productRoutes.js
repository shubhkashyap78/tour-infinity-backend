const express = require("express");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  updateInventory,
} = require("../controllers/productController");
const { auth } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const { requireDb } = require("../middleware/requireDb");

const router = express.Router();

router.get("/", requireDb, auth, requireRole(["admin", "staff"]), listProducts);
router.get("/:id", requireDb, auth, requireRole(["admin", "staff"]), getProduct);
router.post("/", requireDb, auth, requireRole(["admin", "staff"]), createProduct);
router.put("/:id", requireDb, auth, requireRole(["admin", "staff"]), updateProduct);
router.delete("/:id", requireDb, auth, requireRole(["admin"]), deleteProduct);
router.post("/:id/duplicate", requireDb, auth, requireRole(["admin", "staff"]), duplicateProduct);
router.patch("/:id/inventory", requireDb, auth, requireRole(["admin", "staff"]), updateInventory);

module.exports = router;
