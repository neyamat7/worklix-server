const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const usersCollection = getDB().collection("users");

exports.createUser = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required." });
    }

    // Check if user exists
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return res.status(200).json({ message: "User already exists." });
    }

    // Insert new user
    const now = new Date();
    const newUser = {
      email,
      role,
      create_at: now,
      last_log_in: now,
    };

    const result = await usersCollection.insertOne(newUser);

    res.send(result);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email)
      return res.status(400).json({ message: "Email query is required." });

    const regex = new RegExp(email, "i"); // case-insensitive

    const users = await usersCollection
      .find({ email: regex })
      // .project({ email: 1, role: 1, create_at: 1, last_log_in: 1 }) // Only needed fields
      .limit(10)
      .toArray();

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserRole = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email query parameter is required." });
    }

    const user = await usersCollection.findOne(
      { email },
      { projection: { role: 1 } }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ role: user.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Role updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
