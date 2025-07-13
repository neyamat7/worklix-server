const { ObjectId } = require("mongodb");
const { getDB, client } = require("../db");
const db = getDB();
const withdrawCollection = db.collection("withdraw");
const usersCollection = db.collection("users");
const notificationsCollection = db.collection("notifications");

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
        {
          $inc: { coins: -withdrawalCoin, pending_withdrawals: withdrawalCoin },
        },
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

// used: approve withdrawal request
exports.approveWithdrawal = async (req, res) => {
  const withdrawalId = req.params.id;

  if (!ObjectId.isValid(withdrawalId)) {
    return res.status(400).json({ message: "Invalid withdrawal ID." });
  }

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      // 1️⃣ Find the withdrawal record
      const withdrawal = await withdrawCollection.findOne(
        { _id: new ObjectId(withdrawalId) },
        { session }
      );

      if (!withdrawal) {
        throw new Error("Withdrawal not found.");
      }

      const { withdrawal_coin, withdrawal_amount, worker_email } = withdrawal;

      // 2️⃣ Update withdrawal status
      await withdrawCollection.updateOne(
        { _id: new ObjectId(withdrawalId) },
        { $set: { status: "approved" } },
        { session }
      );

      // 3️⃣ Decrement user's pending withdrawals
      const userResult = await usersCollection.updateOne(
        { email: worker_email, role: "worker" },
        { $inc: { pending_withdrawals: -withdrawal_coin } },
        { session }
      );

      if (userResult.matchedCount === 0) {
        throw new Error("Worker user not found.");
      }

      // 4️⃣ Insert notification

      const notification = {
        message: `Your withdrawal request of ${withdrawal_amount} has been approved.`,
        toEmail: worker_email,
        actionRoute: "/dashboard/worker-home",
        time: new Date(),
        status: "success",
      };
      await notificationsCollection.insertOne(notification, { session });

      // Emit real-time event
      const io = req.app.get("io");
      io.to(worker_email).emit("new-notification", notification);
    });

    res.json({
      message: "Withdrawal approved and pending withdrawals decremented.",
    });
  } catch (error) {
    console.error("Error approving withdrawal:", error);
    res
      .status(500)
      .json({ message: error.message || "Internal server error." });
  } finally {
    await session.endSession();
  }
};
