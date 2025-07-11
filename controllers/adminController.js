const { ObjectId } = require("mongodb");
const { getDB, client } = require("../db");
const db = getDB();
const tasksCollection = db.collection("tasks");
const usersCollection = db.collection("users");

// used route
// get all tasks for admin
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await tasksCollection
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// used route
// delete task by id
exports.deleteTaskByAdmin = async (req, res) => {
  const taskId = req.params.id;

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
