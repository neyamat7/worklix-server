const express = require("express");
const router = express.Router();
const workerController = require("../controllers/workerController");

router.get("/tasks-list", workerController.getTaskList);
router.get("/task/:taskId", workerController.getTaskById);

module.exports = router;
