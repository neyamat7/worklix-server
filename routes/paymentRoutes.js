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
router.get("/records", paymentController.getPaymentRecordsByEmail);
router.get("/total-payments", paymentController.getTotalPayments);

module.exports = router;
