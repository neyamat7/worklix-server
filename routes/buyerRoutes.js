const express = require("express");
const router = express.Router();
const buyerController = require("../controllers/buyerController");

// 🟢 post new task of buyer
router.post("/tasks", buyerController.addNewTask);
router.get("/tasks", buyerController.getTasksByBuyerEmail);
router.patch("/tasks/:taskId", buyerController.updateTaskById);
router.delete("/tasks/:taskId", buyerController.deleteTaskById);

module.exports = router;
