const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xrpsmxy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

var admin = require("firebase-admin");
var serviceAccount = require("./courier-project-firebase-service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  // const email = req.query.email;

  // if (req.path === "/artifacts" && !email) {
  //   req.decoded = null;
  //   return next();
  // }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ error: "Unauthorized access" });
  }

  // console.log("authHeader found, proceeding with token verification");

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.decoded = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return res.status(401).send({ error: "Unauthorized access" });
  }
};

// verify token email
const verifyTokenEmail = (req, res, next) => {
  const email = req.query.email;
  console.log(email);

  // If email is provided in the query, check if it matches the decoded token's email
  if (email && (!req.decoded || email !== req.decoded.email)) {
    return res.status(403).send({ error: "Forbidden access" });
  }
  next();
};

// ✅ The verifyAdmin middleware defined here, in this file
function verifyAdmin(usersCollection) {
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

      next();
    } catch (error) {
      console.error("Error verifying admin:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
}

function verifyRider(usersCollection) {
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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const db = client.db("parcelsDB");
    const parcelsCollection = db.collection("parcels");
    const paymentCollection = db.collection("payments");
    const trackingsCollection = db.collection("trackings");
    const usersCollection = db.collection("users");
    const ridersCollection = db.collection("riders");

    // store user data
    app.post("/users", async (req, res) => {
      try {
        const { email, role } = req.body;

        if (!email || !role) {
          return res
            .status(400)
            .json({ message: "Email and role are required." });
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
    });

    // get user by email
    app.get("/users/search", async (req, res) => {
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
    });

    // get specific user role
    app.get("/users/role", async (req, res) => {
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
    });

    // make user admin
    app.patch("/users/:id/role", async (req, res) => {
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
    });

    // get  user's parcels
    app.get("/parcels", async (req, res) => {
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
    });

    // get all asignable parcels that are paid but not assigned
    app.get("/parcels/assignable", async (req, res) => {
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
    });

    // get eligible rider to assign parcel
    app.get("/riders/eligible", async (req, res) => {
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
    });

    // assign rider
    app.patch("/assign-rider", async (req, res) => {
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
    });

    // pending deliveries
    // GET /parcels/rider-pending?email=<rider_email>
    app.get("/parcels/rider-pending", async (req, res) => {
      try {
        const riderEmail = req.query.email;

        if (!riderEmail) {
          return res.status(400).json({ message: "Rider email is required." });
        }

        const pendingParcels = await parcelsCollection
          .find({
            delivery_status: { $in: ["rider_assigned", "in_transit"] },
            assigned_rider_email: riderEmail,
          })
          .toArray();

        res.send(pendingParcels);
      } catch (error) {
        console.error("Error fetching pending deliveries:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // parcel delivery status update after pickeup of delivered
    // PATCH /api/parcels/:parcelId/update-status
    app.patch("/parcels/:parcelId/update-status", async (req, res) => {
      try {
        const { parcelId } = req.params;
        const { delivery_status } = req.body;

        const allowedStatuses = ["rider_assigned", "in_transit", "delivered"];

        if (!allowedStatuses.includes(delivery_status)) {
          return res.status(400).json({ message: "Invalid delivery status." });
        }

        // Find the parcel
        const parcel = await parcelsCollection.findOne({
          _id: new ObjectId(parcelId),
        });

        if (!parcel) {
          return res.status(404).json({ message: "Parcel not found." });
        }

        const updateFields = { delivery_status };

        // Optionally store when the parcel was delivered
        if (delivery_status === "delivered") {
          updateFields.delivered_at = new Date();
        }

        if (delivery_status === "in_transit") {
          updateFields.picked_up_at = new Date();
        }

        await parcelsCollection.updateOne(
          { _id: new ObjectId(parcelId) },
          { $set: updateFields }
        );

        console.log(`Parcel status updated to "${delivery_status}".`);

        // If delivered, check for rider pending deliveries
        if (delivery_status === "delivered") {
          const riderEmail = parcel.assigned_rider_email;

          // Count remaining pending deliveries for this rider
          const pendingCount = await parcelsCollection.countDocuments({
            assigned_rider_email: riderEmail,
            payment_status: "paid",
            delivery_status: "assigned rider",
          });

          if (pendingCount === 0) {
            // Update rider work_status to available
            const riderUpdateResult = await ridersCollection.updateOne(
              { email: riderEmail },
              { $set: { work_status: "available" } }
            );

            console.log(
              `No pending deliveries left. Rider "${riderEmail}" set to available.`
            );
          } else {
            console.log(
              `Rider "${riderEmail}" still has ${pendingCount} pending deliveries.`
            );
          }
        }

        res.json({ message: `Parcel status updated to "${delivery_status}".` });
      } catch (error) {
        console.error("Error updating parcel status:", error);
        res.status(500).json({ message: "Internal server error." });
      }
    });

    // get all completed deliveries of a rider
    // Assuming you already have your Express app and MongoDB client set up
    // e.g., const parcelsCollection = db.collection("parcels");

    app.get("/parcels/completed-deliveries", async (req, res) => {
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
    });

    // update cashout status of a parcel
    // PATCH /parcels/:parcelId/cashout
    app.patch("/parcels/:parcelId/cashout", async (req, res) => {
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
    });

    // GET /parcels/status-summary
    app.get("/parcels/status-summary", async (req, res) => {
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
    });

    // get single parcel by id
    app.get("/parcels/:id", async (req, res) => {
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
    });

    // post new parcel to db
    app.post("/parcels", verifyFirebaseToken, async (req, res) => {
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
    });

    // intent payment post api
    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { amount } = req.body;
        console.log(amount);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount, // Amount in cents
          currency: "usd",
          payment_method_types: ["card"],
          // confirm: false,
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // save payment history
    // POST /api/payments/confirm
    app.post("/save-payment", async (req, res) => {
      const { paymentIntentId, paymentMethod, parcelId, userEmail, amount } =
        req.body;

      try {
        // Update parcel
        await parcelsCollection.updateOne(
          { _id: new ObjectId(parcelId) },
          {
            $set: {
              payment_status: "paid",
              paidAt: new Date(),
            },
          }
        );

        // Create payment record
        await paymentCollection.insertOne({
          paymentIntentId,
          paymentMethod,
          amount: Number(amount),
          currency: "usd",
          status: "paid",
          parcelId: new ObjectId(parcelId),
          userEmail,
          paid_at_string: new Date().toISOString(),
          paid_at: new Date(),
        });

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // get payment history by user email
    // Simple GET endpoint to fetch payments by email
    app.get(
      "/payments",
      verifyFirebaseToken,
      verifyTokenEmail,
      async (req, res) => {
        const { email } = req.query;

        const query = {};
        if (email) {
          query.userEmail = email;
        }

        try {
          const payments = await paymentCollection
            .find(query)
            .sort({ paid_at: -1 }) // Newest first
            .toArray();

          // Convert amount from cents to dollars
          const formattedPayments = payments.map((payment) => ({
            ...payment,
            amount: payment.amount / 100,
          }));

          res.send(formattedPayments);
        } catch (error) {
          console.error("Payment fetch error:", error);
          res.status(500).json({ error: "Failed to fetch payments" });
        }
      }
    );

    // post tracking information
    app.post("/trackings", async (req, res) => {
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
    });

    // get tracking updates
    app.get("/tracking/:trackingId", async (req, res) => {
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
    });

    // delete parcel by parcelId
    app.delete("/parcels/:id", async (req, res) => {
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
    });

    // add new rider to the database
    // POST /riders
    app.post("/riders", async (req, res) => {
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
    });

    // get pending riders data
    // GET /api/riders/pending
    app.get(
      "/riders/pending",
      verifyFirebaseToken,
      verifyAdmin(usersCollection),
      async (req, res) => {
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
      }
    );

    // get active riders
    app.get("/riders/active", async (req, res) => {
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
    });

    // PATCH /api/riders/:id/update-status
    app.patch("/riders/:id/update-status", async (req, res) => {
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
          await usersCollection.updateOne(
            { email },
            { $set: { role: "rider" } }
          );
        } else if (status === "pending") {
          await usersCollection.updateOne(
            { email },
            { $set: { role: "user" } }
          );
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
    });

    // app.get(
    //   "/artifacts",
    //   verifyFirebaseToken,
    //   verifyTokenEmail,
    //   async (req, res) => {
    //     const email = req.query.email;

    //     const searchParams = req.query.searchParams;

    //     const query = {};
    //     if (email) {
    //       query.adderEmail = email;
    //     }
    //     if (searchParams) {
    //       query.artifactName = {
    //         $regex: searchParams,
    //         $options: "i",
    //       };
    //     }

    //     const result = await artifactCollection.find(query).toArray();
    //     res.send(result);
    //   }
    // );

    // get featured artifacts by sorting by likes number
    // app.get("/artifacts/featured", async (req, res) => {
    //   const result = await artifactCollection
    //     .aggregate([
    //       {
    //         $addFields: {
    //           likesCount: { $size: "$likes" },
    //         },
    //       },
    //       { $sort: { likesCount: -1, _id: 1 } },
    //       { $limit: 6 },
    //     ])
    //     .toArray();

    //   res.send(result);
    // });

    // get all artifacts liked by a user
    // app.get(
    //   "/artifacts/liked",
    //   verifyFirebaseToken,
    //   verifyTokenEmail,
    //   async (req, res) => {
    //     const email = req.query.email;
    //     const query = { likes: email };
    //     const result = await artifactCollection.find(query).toArray();
    //     res.send(result);
    //   }
    // );

    // get a single artifact by id
    // app.get(
    //   "/artifacts/:id",
    //   verifyFirebaseToken,
    //   verifyTokenEmail,
    //   async (req, res) => {
    //     const id = req.params.id;
    //     const query = { _id: new ObjectId(id) };
    //     const result = await artifactCollection.findOne(query);
    //     res.send(result);
    //   }
    // );

    // create a new artifact
    // app.post(
    //   "/add-artifact",
    //   verifyFirebaseToken,
    //   verifyTokenEmail,
    //   async (req, res) => {
    //     const newArtifact = req.body;
    //     console.log(newArtifact);
    //     const result = await artifactCollection.insertOne(newArtifact);
    //     res.send(result);
    //   }
    // );

    // update an artifact's likes
    // app.patch(
    //   "/artifacts/:artifactId",
    //   verifyFirebaseToken,
    //   verifyTokenEmail,
    //   async (req, res) => {
    //     const artifactId = req.params.artifactId;

    //     const { action, userEmail } = req.body;

    //     const filter = { _id: new ObjectId(artifactId) };
    //     const operation =
    //       action === "like"
    //         ? { $addToSet: { likes: userEmail } }
    //         : { $pull: { likes: userEmail } };

    //     const result = await artifactCollection.updateOne(filter, operation);
    //     res.send(result);
    //   }
    // );

    // update an artifact's
    // app.put(
    //   "/artifacts/:artifactId",
    //   verifyFirebaseToken,
    //   verifyTokenEmail,
    //   async (req, res) => {
    //     const artifactId = req.params.artifactId;
    //     const updatedArtifact = req.body;

    //     const filter = { _id: new ObjectId(artifactId) };
    //     const options = { upsert: true };
    //     const updateDocument = {
    //       $set: updatedArtifact,
    //     };

    //     const result = await artifactCollection.updateOne(
    //       filter,
    //       updateDocument,
    //       options
    //     );
    //     res.send(result);
    //   }
    // );

    // app.delete(
    //   "/artifacts/:artifactId",
    //   verifyFirebaseToken,
    //   verifyTokenEmail,
    //   async (req, res) => {
    //     const artifactId = req.params.artifactId;

    //     const query = { _id: new ObjectId(artifactId) };
    //     const result = await artifactCollection.deleteOne(query);
    //     res.send(result);
    //   }
    // );

    // await client.db("admin").command({ ping: 1 });

    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server start");
});

app.listen(port, () => {
  console.log(`my server is running on ${port}`);
});
