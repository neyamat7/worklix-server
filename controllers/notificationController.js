const { getDB } = require("../db");

const db = getDB();
const notificationsCollection = db.collection("notifications");

exports.getNotificationsByEmail = async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const notifications = await notificationsCollection
      .find({ toEmail: email })
      .sort({ time: -1 }) // Newest first
      .toArray();

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
