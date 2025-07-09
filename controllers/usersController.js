const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const usersCollection = getDB().collection("users");

exports.createUser = async (req, res) => {
  try {
    const { name, email, photoURL, coins, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Check if the user already exists
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      // User already exists; send 200 OK
      return res.status(200).json({ message: "User already exists." });
    }

    // If no role/coins provided, set defaults
    const userRole = role || "worker";
    const userCoins = coins ?? 10;

    const now = new Date();
    const newUser = {
      name,
      email,
      photoURL,
      role: userRole,
      coins: userCoins,
      created_at: now,
    };

    const result = await usersCollection.insertOne(newUser);

    return res.status(201).json({
      message: "User created successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Internal server error." });
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
        .json({
          message: "Email query parameter is required to get user role",
        });
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
