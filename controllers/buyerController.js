const { ObjectId } = require("mongodb");
const { getDB, client } = require("../db");
const db = getDB();
const tasksCollection = db.collection("tasks");
const usersCollection = db.collection("users");

exports.addNewTask = async (req, res) => {
  const session = client.startSession();

  try {
    const {
      buyer_email,
      task_title,
      task_detail,
      required_workers,
      payable_amount,
      completion_date,
      submission_info,
      task_image_url,
    } = req.body;

    // Validate required fields
    if (
      !buyer_email ||
      !task_title ||
      !task_detail ||
      !required_workers ||
      !payable_amount ||
      !completion_date ||
      !submission_info
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Convert numeric fields
    const totalWorkers = parseInt(required_workers);
    const amountPerWorker = parseFloat(payable_amount);
    if (isNaN(totalWorkers) || isNaN(amountPerWorker)) {
      return res.status(400).json({ message: "Invalid numeric values." });
    }

    const totalPayableAmount = totalWorkers * amountPerWorker;

    // Start transaction
    await session.withTransaction(async () => {
      // Fetch buyer's available coins
      const buyer = await usersCollection.findOne(
        { email: buyer_email },
        { session }
      );

      if (!buyer) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Buyer not found." });
      }
      console.log("Incoming request body:", req.body);

      if (buyer.coins < totalPayableAmount) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: "Insufficient coins to create this task." });
      }

      // Create task object
      const now = new Date();
      const newTask = {
        buyer_email,
        task_title,
        task_detail,
        task_image_url: task_image_url || "",
        submission_info,
        total_workers: totalWorkers,
        required_workers: totalWorkers,
        payable_amount: amountPerWorker,
        total_payable_amount: totalPayableAmount,
        total_paid_workers: 0,
        total_paid_amount: 0,
        completion_date: new Date(completion_date),
        created_at: now,
        status: "active",
      };

      // Insert the task
      const insertResult = await tasksCollection.insertOne(newTask, {
        session,
      });

      // Deduct coins
      await usersCollection.updateOne(
        { email: buyer_email },
        { $inc: { coins: -totalPayableAmount } },
        { session }
      );

      // Commit transaction
      res.status(201).json({
        message: "Task created successfully.",
        taskId: insertResult.insertedId,
      });
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Internal server error." });
  } finally {
    await session.endSession();
  }
};

exports.getTasksByBuyerEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Buyer email is required." });
    }

    const tasks = await tasksCollection
      .find({ buyer_email: email })
      .sort({ completion_date: -1 }) // Descending
      .toArray();

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.deleteTaskById = async (req, res) => {
  const { taskId } = req.params;
  if (!ObjectId.isValid(taskId)) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      // 1️⃣ Find the task
      const task = await tasksCollection.findOne(
        { _id: new ObjectId(taskId) },
        { session }
      );

      if (!task) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Task not found." });
      }

      // 2️⃣ Find the user
      const user = await usersCollection.findOne(
        { email: task.buyer_email },
        { session }
      );

      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Buyer not found." });
      }

      // 3️⃣ Calculate refill amount only if task is uncompleted
      let refillAmount = 0;
      if (task.status === "active") {
        refillAmount = task.required_workers * task.payable_amount;
      }

      // 4️⃣ Delete the task
      await tasksCollection.deleteOne(
        { _id: new ObjectId(taskId) },
        { session }
      );

      // 5️⃣ Refund coins if applicable
      if (refillAmount > 0) {
        await usersCollection.updateOne(
          { email: task.buyer_email },
          { $inc: { coins: refillAmount } },
          { session }
        );
      }

      // 6️⃣ Respond success
      res.status(200).json({
        message: "Task deleted successfully.",
        refunded: refillAmount,
      });
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Internal server error." });
  } finally {
    await session.endSession();
  }
};

