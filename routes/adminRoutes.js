const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Get all tasks
router.get("/all-tasks", adminController.getAllTasks);

// delete task by ID
router.delete("/:id/delete", adminController.deleteTaskByAdmin);

module.exports = router;
