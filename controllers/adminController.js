const { ObjectId } = require("mongodb");
const { getDB, client } = require("../db");
const db = getDB();
const tasksCollection = db.collection("tasks");
const usersCollection = db.collection("users");
const submissionsCollection = db.collection("submissions");

// get all tasks for admin
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await tasksCollection
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "buyer_email",
            foreignField: "email",
            as: "buyer_info",
          },
        },
        {
          $match: {
            buyer_info: { $ne: [] },
          },
        },
        {
          $sort: { created_at: -1 },
        },
        {
          $project: {
            buyer_info: 0,
          },
        },
      ])
      .toArray();

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// delete task by id
exports.deleteTaskByAdmin = async (req, res) => {
  const taskId = req.params.id;
  // console.log("task deleted by admin");

  if (!ObjectId.isValid(taskId)) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  const session = client.startSession();

  try {
    let refillAmount = 0;

    await session.withTransaction(async () => {
      // 1️⃣ Find the task to get buyer_email and amounts
      const task = await tasksCollection.findOne(
        { _id: new ObjectId(taskId) },
        { session }
      );

      if (!task) {
        throw new Error("Task not found.");
      }

      // 2️⃣ Calculate refill amount
      refillAmount = (task.required_workers || 0) * (task.payable_amount || 0);

      // 3️⃣ Refund coins to buyer
      const buyerUpdate = await usersCollection.updateOne(
        { email: task.buyer_email, role: "buyer" },
        { $inc: { coins: refillAmount } },
        { session }
      );

      if (buyerUpdate.matchedCount === 0) {
        throw new Error("Buyer not found.");
      }

      // 4️⃣ Delete the task
      const deleteResult = await tasksCollection.deleteOne(
        { _id: new ObjectId(taskId) },
        { session }
      );

      if (deleteResult.deletedCount === 0) {
        throw new Error("Failed to delete task.");
      }

      // 5️⃣ Delete only pending submissions for this specific task
      const deletePendingSubmissions = await submissionsCollection.deleteMany(
        {
          task_id: new ObjectId(task._id),
          status: "pending",
        },
        { session }
      );

      if (deletePendingSubmissions.deletedCount === 0) {
        throw new Error("Failed to delete pending submissions.");
      }

      const pendingRefund =
        deletePendingSubmissions.deletedCount * (task.payable_amount || 0);

      await usersCollection.updateOne(
        { email: task.buyer_email, role: "buyer" },
        { $inc: { coins: pendingRefund } },
        { session }
      );
    });

    res.json({
      message: `Task deleted successfully. Refunded ${refillAmount} coins to buyer.`,
    });
  } catch (error) {
    console.error("Error deleting task by admin:", error);
    res
      .status(500)
      .json({ message: error.message || "Internal server error." });
  } finally {
    await session.endSession();
  }
};
