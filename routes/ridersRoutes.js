const express = require("express");
const router = express.Router();
const riderController = require("../controllers/ridersController");
const { verifyFirebaseToken } = require("../middlewares/auth");
const { getDB } = require("../db");
const { verifyAdmin } = require("../middlewares/role");

// 🟢 Create new rider
router.post("/", riderController.createRider);

// 🟢 Get eligible riders to assign
router.get("/eligible", riderController.getAvailableRiders);

// 🟢 Get pending riders (admin protected)
router.get(
  "/pending",
  verifyFirebaseToken,
  verifyAdmin(),
  riderController.getPendingRiders
);

// 🟢 Get active riders
router.get("/active", riderController.getActiveRiders);

// 🟢 Update rider status
router.patch("/:id/update-status", riderController.updateRiderStatus);

module.exports = router;
