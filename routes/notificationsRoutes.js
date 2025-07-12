const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// get notifications by email
router.get("/", notificationController.getNotificationsByEmail);

module.exports = router;
