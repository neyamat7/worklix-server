const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const ridersCollection = getDB().collection("riders");
const usersCollection = getDB().collection("users");

exports.createRider = async (req, res) => {
  try {
    const rider = req.body;

    if (!rider.email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Check if rider exists by email
    const existing = await ridersCollection.findOne({ email: rider.email });

    if (existing) {
      return res.status(200).json({ message: "Rider already exists." });
    }

    // Add timestamps
    rider.create_at = new Date();
    rider.last_log_in = new Date();

    // Insert rider
    const result = await ridersCollection.insertOne(rider);

    res.send(result);
  } catch (error) {
    console.error("Error creating rider:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getPendingRiders = async (req, res) => {
  try {
    // Find all documents with:
    // status: "pending"
    const pendingRiders = await ridersCollection
      .find({ status: "pending" })
      .toArray();

    res.send(pendingRiders);
  } catch (error) {
    console.error("Error fetching pending riders:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getActiveRiders = async (req, res) => {
  try {
    // Find all riders where:
    // role: "rider"
    // status: "active"
    const activeRiders = await ridersCollection
      .find({ status: "active" })
      .toArray();

    res.send(activeRiders);
  } catch (error) {
    console.error("Error fetching active riders:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.updateRiderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, email } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid rider ID." });
    }

    // if status === reject, then delete from collection
    if (status === "reject") {
      await ridersCollection.deleteOne({ _id: new ObjectId(id) });

      return res.status(200).json({ message: "Rider deleted." });
    }

    // if active then update the user in usercollection who become rider now
    if (status === "active") {
      await usersCollection.updateOne({ email }, { $set: { role: "rider" } });
    } else if (status === "pending") {
      await usersCollection.updateOne({ email }, { $set: { role: "user" } });
    }

    // Update status to "active"
    const result = await ridersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, status_updated_at: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Rider not found." });
    }

    res.send(result);
  } catch (error) {
    console.error("Error updating rider status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getAvailableRiders = async (req, res) => {
  try {
    const { district, status } = req.query;

    // Validate required query params
    if (!district || !status) {
      return res
        .status(400)
        .json({ message: "Both district and status are required." });
    }

    const query = {
      district,
      status,
    };

    const riders = await ridersCollection
      .find(query)
      .sort({ createdAt: -1 }) // newest first
      .toArray();

    res.json(riders);
  } catch (error) {
    console.error("Error fetching riders:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
