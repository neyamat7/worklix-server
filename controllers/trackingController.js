const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const trackingsCollection = getDB().collection("trackings");

exports.createTrackingEvent = async (req, res) => {
  try {
    const { tracking_id, status, details, updated_by } = req.body;

    if (!tracking_id || !status || !details || !updated_by) {
      return res.status(400).json({
        success: false,
        message: "status, details, tracking_id and updatedBy are required.",
      });
    }

    // Fetch the parcel to ensure it exists and get snapshot info
    const parcel = await parcelsCollection.findOne({ tracking_id });

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found.",
      });
    }

    const trackingEvent = {
      tracking_id,
      status,
      details,
      updated_at: new Date(),
      updated_by,
      snapshot: {
        receiverName: parcel.receiverName,
        receiverRegion: parcel.receiverRegion,
        receiverServiceCenter: parcel.receiverServiceCenter,
        weight: parcel?.weight ? parcel.weight : null,
        cost: parcel?.cost,
      },
    };

    const result = await trackingsCollection.insertOne(trackingEvent);

    res.send(result);
  } catch (error) {
    console.error("Error adding tracking event:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding tracking event.",
      error: error.message,
    });
  }
};

exports.getTrackingEvents = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const events = await trackingsCollection
      .find({ tracking_id: trackingId })
      .sort({ updatedAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching tracking events:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tracking events.",
      error: error.message,
    });
  }
};
