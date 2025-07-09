const express = require("express");
const router = express.Router();
const buyerController = require("../controllers/buyerController");

// 🟢 post new task of buyer
router.post("/tasks", buyerController.addNewTask);

module.exports = router;
