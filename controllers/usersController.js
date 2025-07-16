const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const usersCollection = getDB().collection("users");
const tasksCollection = getDB().collection("tasks");

// used route
exports.createUser = async (req, res) => {
  try {
    const { name, email, photoURL, coins, role, uid } = req.body;

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
      uid,
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

exports.getUserByExactEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email query parameter is required." });
    }

    // Do an exact match (case-insensitive)
    const user = await usersCollection.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// used route
// get all user's data

exports.getAllUsers = async (req, res) => {
  try {
    // You could optionally restrict this to admin only with a middleware
    const users = await usersCollection
      .find({})
      .sort({ created_at: -1 }) // newest users first
      .toArray();

    res.send(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// used route
exports.getUserRole = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
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

// used route
// update user role
exports.updateUserRole = async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  // Validate
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  if (!role || !["worker", "buyer", "admin"].includes(role)) {
    return res.status(400).json({
      message: "Role is required and must be one of: worker, buyer, admin.",
    });
  }

  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "User role updated successfully." });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// used route
// delete usre from database and from firebase

const admin = require("../firebase");

exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  // Validate
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  try {
    // 1️⃣ Find the user in MongoDB (to get firebase_uid)
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.uid) {
      return res
        .status(400)
        .json({ message: "Cannot delete user: firebase_uid missing." });
    }

    // 2️⃣ Delete from Firebase
    await admin.auth().deleteUser(user.uid);

    // 3️⃣ Delete from MongoDB
    await usersCollection.deleteOne({ _id: new ObjectId(userId) });

    res.json({
      message: "User deleted successfully from database and Firebase.",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: error.message || "Internal server error." });
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.params.id;

  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      // 1️⃣ Find the user
      const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { session }
      );

      if (!user) {
        throw new Error("User not found.");
      }

      if (!user.uid) {
        throw new Error("Cannot delete user: firebase_uid missing.");
      }

      const buyerEmail = user.email;

      // 2️⃣ Delete user from Firebase
      await admin.auth().deleteUser(user.uid);

      // 3️⃣ Delete user from MongoDB
      await usersCollection.deleteOne(
        { _id: new ObjectId(userId) },
        { session }
      );

      // 4️⃣ Deactivate all their active tasks
      await tasksCollection.updateMany(
        { buyer_email: buyerEmail, status: "active" },
        { $set: { status: "inActive" } },
        { session }
      );
    });

    res.json({
      message: "User deleted, Firebase account removed, and tasks deactivated.",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: error.message || "Internal server error." });
  } finally {
    await session.endSession();
  }
};
