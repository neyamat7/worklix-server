const express = require("express");
const router = express.Router();
const parcelController = require("../controllers/parcelsController");
const { verifyFirebaseToken } = require("../middlewares/auth");

// 🟢 Get parcels of a user (by email query)
router.get("/", parcelController.getUserParcels);

// 🟢 Get assignable parcels
router.get("/assignable", parcelController.getAssignableParcels);

// 🟢 Get completed deliveries for a rider
router.get("/completed-deliveries", parcelController.getCompletedDeliveries);

// 🟢 Get delivery status summary
router.get("/status-summary", parcelController.getStatusSummary);

// 🟢 Get single parcel by ID
router.get("/:id", parcelController.getSingleParcel);

// 🟢 Create a new parcel
router.post("/", verifyFirebaseToken, parcelController.createParcel);

// 🟢 Update parcel status
router.patch("/:parcelId/update-status", parcelController.updateParcelStatus);

// 🟢 Update cashout status
router.patch("/:parcelId/cashout", parcelController.updateParcelStatus);

// 🟢 Assign rider to parcel
router.patch("/assign-rider", parcelController.assignRiderToParcel);

// 🟢 Delete parcel
router.delete("/:id", parcelController.deleteParcel);

module.exports = router;
