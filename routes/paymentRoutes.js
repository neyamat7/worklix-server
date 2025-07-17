const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentsController");
const {
  verifyFirebaseToken,
  verifyTokenEmail,
} = require("../middlewares/auth");
const { verifyBuyer, verifyAdmin } = require("../middlewares/role");
 

// 🟢 Create payment intent
router.post(
  "/create-payment-intent",
  verifyFirebaseToken,
  paymentController.createPaymentIntent
);

router.post(
  "/record",
  verifyFirebaseToken,
  verifyBuyer(),
  paymentController.recordPaymentAndUpdateCoins
);

router.get(
  "/records",
  verifyFirebaseToken,
  verifyTokenEmail,
  verifyBuyer(),
  paymentController.getPaymentRecordsByEmail
);

router.get(
  "/total-payments",
  verifyFirebaseToken,
  verifyAdmin(),
  paymentController.getTotalPayments
);

module.exports = router;
