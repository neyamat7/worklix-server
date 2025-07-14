const express = require("express");
const router = express.Router();
const publicController = require("../controllers/publicController");

// Get top workers
router.get("/top-workers", publicController.getTopWorkers);
router.get("/recently-added-tasks", publicController.getRecentlyAddedTasks);

module.exports = router;
