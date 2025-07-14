const { ObjectId } = require("mongodb");
const { getDB, client } = require("../db");
const db = getDB();
const tasksCollection = db.collection("tasks");
const usersCollection = getDB().collection("users");

// get top workers
exports.getTopWorkers = async (req, res) => {
  // Optional: allow limit from query string
  const limit = parseInt(req.query.limit) || 6;

  try {
    const topWorkers = await usersCollection
      .find({ role: "worker" })
      .sort({ coins: -1 })
      .limit(limit)
      .toArray();

    res.send(topWorkers);
  } catch (error) {
    console.error("Error fetching top workers:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getRecentlyAddedTasks = async (req, res) => {
  // Optional: allow ?limit=6
  const limit = parseInt(req.query.limit) || 6;

  try {
    const tasks = await tasksCollection
      .find({})
      .sort({ created_at: -1 }) // Newest first
      .limit(limit)
      .toArray();

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching recently added tasks:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
