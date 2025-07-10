const { ObjectId } = require("mongodb");
const { getDB, client } = require("../db");
const db = getDB();
const tasksCollection = db.collection("tasks");
const usersCollection = db.collection("users");

exports.getTaskList = async (req, res) => {
  try {
    const tasksList = await tasksCollection
      .find({
        required_workers: { $gt: 0 },
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(tasksList);
  } catch (error) {
    console.error("Error fetching available tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTaskById = async (req, res) => {
  const { taskId } = req.params;

  if (!ObjectId.isValid(taskId)) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  try {
    const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.send(task);
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
