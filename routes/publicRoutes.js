const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");

// Get top workers
router.get("/top-workers", usersController.getTopWorkers);

module.exports = router;
