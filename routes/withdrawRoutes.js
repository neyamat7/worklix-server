const express = require("express");
const router = express.Router();
const withdrawController = require("../controllers/withdrawController");
const { verifyFirebaseToken } = require("../middlewares/auth");
const { verifyWorker, verifyAdmin } = require("../middlewares/role");

router.post(
  "/request",
  verifyFirebaseToken,
  verifyWorker(),
  withdrawController.requestWithdrawal
);
router.get(
  "/pending-withdrawals",
  verifyFirebaseToken,
  verifyAdmin(),
  withdrawController.getPendingWithdrawals
);
router.patch(
  "/:id/approve",
  verifyFirebaseToken,
  verifyAdmin(),
  withdrawController.approveWithdrawal
);

module.exports = router;
