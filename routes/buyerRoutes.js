const express = require("express");
const router = express.Router();
const buyerController = require("../controllers/buyerController");
const {
  verifyFirebaseToken,
  verifyTokenEmail,
} = require("../middlewares/auth");
const { verifyBuyer } = require("../middlewares/role");

// 🟢 post new task of buyer
router.post(
  "/tasks",
  verifyFirebaseToken,
  verifyBuyer(),
  buyerController.addNewTask
);
router.get(
  "/tasks",
  verifyFirebaseToken,
  verifyTokenEmail,
  verifyBuyer(),
  buyerController.getTasksByBuyerEmail
);
router.patch(
  "/tasks/:taskId",
  verifyFirebaseToken,
  verifyBuyer(),
  buyerController.updateTaskById
);
router.delete(
  "/tasks/:taskId",
  verifyFirebaseToken,
  verifyBuyer(),
  buyerController.deleteTaskById
);

module.exports = router;
