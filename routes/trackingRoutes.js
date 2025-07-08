const express = require("express");
const router = express.Router();
const trackingController = require("../controllers/trackingController");

// 🟢 Create tracking event
router.post("/", trackingController.createTrackingEvent);

// 🟢 Get tracking events by tracking ID
router.get("/:trackingId", trackingController.getTrackingEvents);

module.exports = router;
