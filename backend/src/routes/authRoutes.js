const express = require("express");
const router = express.Router();

const {
	register,
	login,
	me,
	listPendingOfficials,
	approveOfficial
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/role");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.get("/officials/pending", protect, allowRoles("official"), listPendingOfficials);
router.patch("/officials/:officialId/approve", protect, allowRoles("official"), approveOfficial);

module.exports = router;