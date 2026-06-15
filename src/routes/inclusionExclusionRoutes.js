const express = require("express");
const { getAll, create, update, remove } = require("../controllers/inclusionExclusionController");
const { auth } = require("../middleware/auth");
const { requireDb } = require("../middleware/requireDb");

const router = express.Router();
router.use(requireDb, auth);

router.get("/", getAll);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;
