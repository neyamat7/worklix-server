const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentsController");
const {
  verifyFirebaseToken,
  verifyTokenEmail,
} = require("../middlewares/auth");

// 🟢 Create payment intent
router.post("/create-payment-intent", paymentController.createPaymentIntent);

// 🟢 Save payment
router.post("/save-payment", paymentController.savePayment);

// 🟢 Get payment history by user email (protected)
router.get(
  "/",
  verifyFirebaseToken,
  verifyTokenEmail,
  paymentController.getPaymentsByEmail
);

module.exports = router;
