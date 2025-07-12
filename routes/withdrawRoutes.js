const express = require("express");
const router = express.Router();
const withdrawController = require("../controllers/withdrawController");

router.post("/request", withdrawController.requestWithdrawal);
router.get("/pending-withdrawals", withdrawController.getPendingWithdrawals);
router.patch("/:id/approve", withdrawController.approveWithdrawal);

module.exports = router;
