const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const parcelsCollection = getDB().collection("parcels");

exports.getUserParcels = async (req, res) => {
  try {
    const userEmail = req.query.email;
    const query = {};

    query.createdByUserId = userEmail;

    const parcels = await parcelsCollection
      .find(query)
      .sort({ createdAt: -1 }) // descending
      .toArray();

    res.status(200).json({ success: true, data: parcels });
  } catch (error) {
    console.error("Error fetching parcels:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAssignableParcels = async (req, res) => {
  try {
    const { payment_status, delivery_status } = req.query;

    const query = {
      payment_status,
      delivery_status,
    };

    const parcels = await parcelsCollection
      .find(query)
      .sort({ createdAt: 1 }) //oldest first
      .toArray();

    res.send(parcels);
  } catch (error) {
    console.error("Error fetching parcels:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getCompletedDeliveries = async (req, res) => {
  try {
    const riderEmail = req.query.email;

    // verify rider if rider if the rider is real or not
    // to do for laler

    // Query: rider email + delivery_status in [delivered, service_center_delivered]
    const completedParcels = await parcelsCollection
      .find({
        assigned_rider_email: riderEmail,
        delivery_status: { $in: ["delivered", "service_center_delivered"] },
      })
      .sort({ delivered_at: -1 }) // Optional: most recent first
      .toArray();

    res.send(completedParcels);
  } catch (error) {
    console.error("Error fetching completed deliveries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch completed deliveries.",
    });
  }
};

exports.getSingleParcel = async (req, res) => {
  try {
    // Get the parcelId from the URL parameters
    const { id } = req.params;

    const query = { _id: new ObjectId(id) };

    // Find the parcel by parcelId (not the _id)
    const parcel = await parcelsCollection.findOne(query);

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found",
      });
    }

    // If found, return the parcel
    res.send(parcel);
  } catch (error) {
    console.error("Error fetching parcel:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching parcel",
      error: error.message,
    });
  }
};

exports.createParcel = async (req, res) => {
  console.log(req.headers);

  try {
    const newParcel = req.body;
    console.log(newParcel);

    const result = await parcelsCollection.insertOne(newParcel);

    res.send(result);
  } catch (error) {
    console.error("Error saving parcel:", error);
    res.status(500).json({
      message: "Failed to save parcel.",
      error: error.message,
    });
  }
};

exports.updateParcelStatus = async (req, res) => {
  try {
    const { parcelId } = req.params;

    // Find the parcel
    const parcel = await parcelsCollection.findOne({ parcelId });

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found." });
    }

    // Update the cashout status to cashed_out
    await parcelsCollection.updateOne(
      { parcelId },
      {
        $set: {
          cashout_status: "cashed_out",
          cashout_updated_at: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: `Parcel "${parcelId}" marked as cashed out.`,
    });
  } catch (error) {
    console.error("Error updating cashout status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.deleteParcel = async (req, res) => {
  try {
    const id = req.params.id;
    // Delete operation
    const result = await parcelsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    // Check if document was found and deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Parcel not found" });
    }

    res.send(result);
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

exports.assignRiderToParcel = async (req, res) => {
  try {
    const { parcelId, riderId, riderName, riderEmail } = req.body;
    // Validate input
    if (!parcelId || !riderId) {
      return res
        .status(400)
        .json({ message: "parcelId and riderId are required." });
    }

    // Optionally: verify that parcel and rider exist
    const parcel = await parcelsCollection.findOne({
      _id: new ObjectId(parcelId),
    });
    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found." });
    }

    const rider = await ridersCollection.findOne({
      _id: new ObjectId(riderId),
    });
    if (!rider) {
      return res.status(404).json({ message: "Rider not found." });
    }

    // Update the parcel
    await parcelsCollection.updateOne(
      { _id: new ObjectId(parcelId) },
      {
        $set: {
          delivery_status: "rider_assigned",
          assigned_rider_id: riderId,
          assigned_rider_name: riderName,
          assigned_rider_email: riderEmail,
          assigned_at: new Date(),
        },
      }
    );

    console.log("parcel updated");

    // Update the rider
    await ridersCollection.updateOne(
      { _id: new ObjectId(riderId) },
      {
        $set: {
          work_status: "rider_assigned",
          last_assigned_at: new Date(),
        },
      }
    );

    res.json({ message: "Rider assigned to parcel successfully." });
  } catch (error) {
    console.error("Error assigning rider:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getStatusSummary = async (req, res) => {
  try {
    // Define aggregation pipeline separately
    const pipeline = [
      {
        $group: {
          _id: "$delivery_status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          delivery_status: "$_id",
          count: 1,
        },
      },
      {
        $sort: {
          delivery_status: 1,
        },
      },
    ];

    // Execute the aggregation
    const summary = await parcelsCollection.aggregate(pipeline).toArray();

    // Send the response
    res.send(summary);
  } catch (error) {
    console.error("Error generating status summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get delivery status summary.",
      error: error.message,
    });
  }
};

