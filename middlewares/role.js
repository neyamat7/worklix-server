const { ObjectId } = require("mongodb");
const { getDB, client } = require("../db");
const db = getDB();
// const tasksCollection = db.collection("tasks");
const usersCollection = db.collection("users");

// ✅ The verifyAdmin middleware defined here, in this file
function verifyAdmin() {
  return async function (req, res, next) {
    try {
      const email = req.decoded?.email;

      if (!email) {
        return res.status(401).json({ message: "Email not found in token." });
      }

      const user = await usersCollection.findOne(
        { email },
        { projection: { role: 1 } }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      if (user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
      }
      console.log("admin verified");
      next();
    } catch (error) {
      console.error("Error verifying admin:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
}

function verifyRider() {
  return async function (req, res, next) {
    try {
      const db = require("../db").getDB();
      const usersCollection = db.collection("users");

      const email = req.decoded?.email;

      if (!email) {
        return res.status(401).json({ message: "Email not found in token." });
      }

      const user = await usersCollection.findOne(
        { email },
        { projection: { role: 1 } }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      if (user.role !== "rider") {
        return res.status(403).json({ message: "Access denied. Riders only." });
      }

      // ✅ Rider verified, continue
      next();
    } catch (error) {
      console.error("Error verifying rider:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
}

// will use this for admin
// const requireAdmin = (req, res, next) => {
//   if (req.user?.role !== "admin") {
//     return res.status(403).json({ message: "Forbidden." });
//   }
//   next();
// };

module.exports = { verifyAdmin, verifyRider };
