const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentsController");
// const {
//   verifyFirebaseToken,
//   verifyTokenEmail,
// } = require("../middlewares/auth");

// 🟢 Create payment intent
router.post("/create-payment-intent", paymentController.createPaymentIntent);

router.post("/record", paymentController.recordPaymentAndUpdateCoins);

module.exports = router;
