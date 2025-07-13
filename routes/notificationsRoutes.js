const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const {
  verifyFirebaseToken,
  verifyTokenEmail,
} = require("../middlewares/auth");

// get notifications by email
router.get(
  "/",
  verifyFirebaseToken,
  verifyTokenEmail,
  notificationController.getNotificationsByEmail
);

module.exports = router;
