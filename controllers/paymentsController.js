const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const paymentCollection = getDB().collection("payments");

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    console.log(amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: "usd",
      payment_method_types: ["card"],
      // confirm: false,
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.savePayment = async (req, res) => {
  const { paymentIntentId, paymentMethod, parcelId, userEmail, amount } =
    req.body;

  try {
    // Update parcel
    await parcelsCollection.updateOne(
      { _id: new ObjectId(parcelId) },
      {
        $set: {
          payment_status: "paid",
          paidAt: new Date(),
        },
      }
    );

    // Create payment record
    await paymentCollection.insertOne({
      paymentIntentId,
      paymentMethod,
      amount: Number(amount),
      currency: "usd",
      status: "paid",
      parcelId: new ObjectId(parcelId),
      userEmail,
      paid_at_string: new Date().toISOString(),
      paid_at: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPaymentsByEmail = async (req, res) => {
  const { email } = req.query;

  const query = {};
  if (email) {
    query.userEmail = email;
  }

  try {
    const payments = await paymentCollection
      .find(query)
      .sort({ paid_at: -1 }) // Newest first
      .toArray();

    // Convert amount from cents to dollars
    const formattedPayments = payments.map((payment) => ({
      ...payment,
      amount: payment.amount / 100,
    }));

    res.send(formattedPayments);
  } catch (error) {
    console.error("Payment fetch error:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};
