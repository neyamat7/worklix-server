const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyFirebaseToken } = require("../middlewares/auth");
const { verifyAdmin } = require("../middlewares/role");

// Get all tasks
router.get(
  "/all-tasks",
  verifyFirebaseToken,
  verifyAdmin(),
  adminController.getAllTasks
);

// delete task by ID
router.delete(
  "/:id/delete",
  verifyFirebaseToken,
  verifyAdmin(),
  adminController.deleteTaskByAdmin
);

module.exports = router;
