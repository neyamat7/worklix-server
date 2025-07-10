const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const paymentsCollection = getDB().collection("payments");
const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);
const usersCollection = getDB().collection("users");

// used ****
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, coins } = req.body;
    console.log("Received body:", req.body);

    // Create and confirm payment intent in one step
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ["card"],
      // payment_method: payment_method_id,
      // confirm: true,
      description: `${coins} coins purchase`,
    });

    res.status(200).json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// paymentsController.js

exports.recordPaymentAndUpdateCoins = async (req, res) => {
  try {
    const {
      user_email,
      package_id,
      coins_purchased,
      amount_paid,
      currency,
      payment_date,
      status,
      payment_intent_id,
      payment_method_id,
      payment_method_types,
    } = req.body;

    if (!user_email || !payment_intent_id) {
      return res.status(400).json({
        message: "Missing required payment information.",
      });
    }

    // 1️⃣ Store the payment record
    const paymentRecord = {
      user_email,
      package_id,
      coins_purchased,
      amount_paid,
      currency,
      payment_date: new Date(payment_date),
      status,
      payment_intent_id,
      payment_method_id,
      payment_method_types,
      created_at: new Date(),
    };

    await paymentsCollection.insertOne(paymentRecord);

    // 2️⃣ Increment user's coins
    const updateResult = await usersCollection.updateOne(
      { email: user_email },
      { $inc: { coins: coins_purchased } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        message: "Payment recorded but failed to update user coins.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment saved and coins updated.",
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({
      message: "Internal server error.",
    });
  }
};

// exports.savePayment = async (req, res) => {
//   const { paymentIntentId, paymentMethod, parcelId, userEmail, amount } =
//     req.body;

//   try {
//     // Update parcel
//     await parcelsCollection.updateOne(
//       { _id: new ObjectId(parcelId) },
//       {
//         $set: {
//           payment_status: "paid",
//           paidAt: new Date(),
//         },
//       }
//     );

//     // Create payment record
//     await paymentCollection.insertOne({
//       paymentIntentId,
//       paymentMethod,
//       amount: Number(amount),
//       currency: "usd",
//       status: "paid",
//       parcelId: new ObjectId(parcelId),
//       userEmail,
//       paid_at_string: new Date().toISOString(),
//       paid_at: new Date(),
//     });

//     res.json({ success: true });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.getPaymentsByEmail = async (req, res) => {
//   const { email } = req.query;

//   const query = {};
//   if (email) {
//     query.userEmail = email;
//   }

//   try {
//     const payments = await paymentCollection
//       .find(query)
//       .sort({ paid_at: -1 }) // Newest first
//       .toArray();

//     // Convert amount from cents to dollars
//     const formattedPayments = payments.map((payment) => ({
//       ...payment,
//       amount: payment.amount / 100,
//     }));

//     res.send(formattedPayments);
//   } catch (error) {
//     console.error("Payment fetch error:", error);
//     res.status(500).json({ error: "Failed to fetch payments" });
//   }
// };
