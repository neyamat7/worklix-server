const express = require("express");
const router = express.Router();
const withdrawController = require("../controllers/withdrawController");

router.post("/request", withdrawController.requestWithdrawal);

module.exports = router;
