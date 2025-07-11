const { ObjectId } = require("mongodb");
const { getDB, client } = require("../db");
const db = getDB();
const submissionsCollection = db.collection("submissions");
const tasksCollection = db.collection("tasks");
const usersCollection = db.collection("users");

// Create a submission
// exports.saveSubmissiosData = async (req, res) => {
//   const submission = req.body;

//   // Simple validation
//   const requiredFields = [
//     "buyer_email",
//     "buyer_name",
//     "payable_amount",
//     "status",
//     "submission_date",
//     "submission_details",
//     "task_id",
//     "task_title",
//     "worker_email",
//     "worker_name",
//   ];

//   for (const field of requiredFields) {
//     if (!submission[field]) {
//       return res.status(400).json({ message: `Missing field: ${field}` });
//     }
//   }

//   // Convert task_id to ObjectId
//   if (!ObjectId.isValid(submission.task_id)) {
//     return res.status(400).json({ message: "Invalid task_id." });
//   }

//   submission.task_id = new ObjectId(submission.task_id);

//   try {
//     const result = await submissionsCollection.insertOne(submission);

//     res.status(201).json({
//       message: "Submission created successfully.",
//       insertedId: result.insertedId,
//     });
//   } catch (error) {
//     console.error("Error creating submission:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };

exports.saveSubmissionsData = async (req, res) => {
  const submission = req.body;

  const requiredFields = [
    "buyer_email",
    "buyer_name",
    "payable_amount",
    "status",
    "submission_date",
    "submission_details",
    "task_id",
    "task_title",
    "worker_email",
    "worker_name",
  ];

  for (const field of requiredFields) {
    if (!submission[field]) {
      return res.status(400).json({ message: `Missing field: ${field}` });
    }
  }

  if (!ObjectId.isValid(submission.task_id)) {
    return res.status(400).json({ message: "Invalid task_id." });
  }

  submission.task_id = new ObjectId(submission.task_id);

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      // Insert submission
      await submissionsCollection.insertOne(submission, { session });

      // Update task: decrement required_workers by 1 (only if > 0)
      const updateResult = await tasksCollection.updateOne(
        {
          _id: submission.task_id,
          required_workers: { $gt: 0 }, // safety check
        },
        {
          $inc: { required_workers: -1 },
        },
        { session }
      );

      if (updateResult.matchedCount === 0) {
        // If no task matched (already 0 workers), abort
        throw new Error("No available workers remaining for this task.");
      }
    });

    res.status(201).json({
      message: "Submission created and task updated successfully.",
    });
  } catch (error) {
    console.error("Error creating submission and updating task:", error);
    res
      .status(500)
      .json({ message: error.message || "Internal server error." });
  } finally {
    await session.endSession();
  }
};

exports.checkSubmissionExists = async (req, res) => {
  const { worker_email, task_id } = req.query;

  // Validate
  if (!worker_email || !task_id) {
    return res.status(400).json({
      message: "worker_email and task_id are required.",
    });
  }

  try {
    // If you stored task_id as ObjectId:
    const query = {
      worker_email,
      task_id: ObjectId.isValid(task_id) ? new ObjectId(task_id) : task_id,
    };

    const existing = await submissionsCollection.findOne(query);

    return res.json({
      alreadySubmitted: !!existing,
    });
  } catch (error) {
    console.error("Error checking submission existence:", error);
    res.status(500).json({
      message: "Internal server error.",
    });
  }
};

exports.getSubmissionsPaginated = async (req, res) => {
  try {
    const { worker_email, page = 1 } = req.query;

    // Validate required worker_email
    if (!worker_email) {
      return res.status(400).json({ message: "worker_email is required." });
    }

    const pageSize = 10;
    const skip = (parseInt(page) - 1) * pageSize;

    const query = { worker_email };

    const totalCount = await submissionsCollection.countDocuments(query);

    const submissions = await submissionsCollection
      .find(query)
      .sort({ submission_date: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    res.json({
      submissions,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / pageSize),
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching paginated submissions:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.getPendingSubmissions = async (req, res) => {
  try {
    const { buyer_email } = req.query;

    // Validate required buyer_email
    if (!buyer_email) {
      return res.status(400).json({ message: "buyer_email is required." });
    }

    const query = { buyer_email, status: "pending" };

    const pendingSubmissions = await submissionsCollection
      .find(query)
      .toArray();

    res.send(pendingSubmissions);
  } catch (error) {
    console.error("Error fetching pending submissions:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.approveSubmission = async (req, res) => {
  const submissionId = req.params.id;
  const { worker_email, payable_amount, task_id } = req.body;

  // Validate
  if (!ObjectId.isValid(submissionId)) {
    return res.status(400).json({ message: "Invalid submission ID." });
  }
  if (!worker_email || !payable_amount) {
    return res
      .status(400)
      .json({ message: "worker_email and payable_amount are required." });
  }

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      // 1️⃣ Update the submission status
      const submissionUpdate = await submissionsCollection.updateOne(
        { _id: new ObjectId(submissionId) },
        { $set: { status: "approved" } },
        { session }
      );

      if (submissionUpdate.matchedCount === 0) {
        throw new Error("Submission not found.");
      }

      // 2️⃣ Increment worker's coins
      const userUpdate = await usersCollection.updateOne(
        { email: worker_email, role: "worker" },
        { $inc: { coins: payable_amount } },
        { session }
      );

      if (userUpdate.matchedCount === 0) {
        throw new Error("Worker not found.");
      }

      // 3️⃣ Increment total_paid_amount for the task
      const taskUpdate = await tasksCollection.updateOne(
        { _id: new ObjectId(task_id) },
        { $inc: { total_paid_amount: payable_amount } },
        { session }
      );

      if (taskUpdate.matchedCount === 0) {
        throw new Error("Task not found.");
      }
    });

    res.json({ message: "Submission approved and worker paid successfully." });
  } catch (error) {
    console.error("Error approving submission:", error);
    res
      .status(500)
      .json({ message: error.message || "Internal server error." });
  } finally {
    await session.endSession();
  }
};
