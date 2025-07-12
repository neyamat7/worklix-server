const { ObjectId } = require("mongodb");
const { getDB, client } = require("../db");
const db = getDB();
const withdrawCollection = db.collection("withdraw");
const usersCollection = db.collection("users");

exports.requestWithdrawal = async (req, res) => {
  const withdrawal = req.body;

  const requiredFields = [
    "worker_email",
    "worker_name",
    "withdrawal_coin",
    "withdrawal_amount",
    "payment_system",
    "account_number",
    "withdraw_date",
    "status",
  ];

  for (const field of requiredFields) {
    if (!withdrawal[field]) {
      return res.status(400).json({ message: `Missing field: ${field}` });
    }
  }

  // Convert numeric fields
  const withdrawalCoin = Number(withdrawal.withdrawal_coin);
  const withdrawalAmount = Number(withdrawal.withdrawal_amount);

  if (isNaN(withdrawalCoin) || withdrawalCoin <= 0) {
    return res.status(400).json({ message: "Invalid withdrawal_coin amount." });
  }

  if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
    return res.status(400).json({ message: "Invalid withdrawal_amount." });
  }

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      // 1️⃣ Find worker user
      const user = await usersCollection.findOne(
        { email: withdrawal.worker_email, role: "worker" },
        { session }
      );

      if (!user) {
        throw new Error("Worker not found.");
      }

      if ((user.coins || 0) < withdrawalCoin) {
        throw new Error("Insufficient coins for withdrawal.");
      }

      // 2️⃣ Deduct coins
      await usersCollection.updateOne(
        { _id: user._id },
        { $inc: { coins: -withdrawalCoin } },
        { session }
      );

      // 3️⃣ Insert withdrawal record
      const withdrawalDoc = {
        worker_email: withdrawal.worker_email,
        worker_name: withdrawal.worker_name,
        withdrawal_coin: withdrawalCoin,
        withdrawal_amount: withdrawalAmount,
        payment_system: withdrawal.payment_system,
        account_number: withdrawal.account_number,
        withdraw_date: new Date(withdrawal.withdraw_date),
        status: withdrawal.status,
      };

      await withdrawCollection.insertOne(withdrawalDoc, { session });
    });

    res
      .status(201)
      .json({ message: "Withdrawal created and coins deducted successfully." });
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    res
      .status(500)
      .json({ message: error.message || "Internal server error." });
  } finally {
    await session.endSession();
  }
};

// used get all withdrawal requests for admin
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const withdrawals = await withdrawCollection
      .find({ status: "pending" })
      .sort({ withdraw_date: -1 }) // newest first
      .toArray();

    res.send(withdrawals);
  } catch (error) {
    console.error("Error fetching pending withdrawals:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
