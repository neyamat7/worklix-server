const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const db = getDB();
const submissionsCollection = db.collection("submissions");

// Create a submission
exports.saveSubmissiosData = async (req, res) => {
  const submission = req.body;

  // Simple validation
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

  // Convert task_id to ObjectId
  if (!ObjectId.isValid(submission.task_id)) {
    return res.status(400).json({ message: "Invalid task_id." });
  }

  submission.task_id = new ObjectId(submission.task_id);

  try {
    const result = await submissionsCollection.insertOne(submission);

    res.status(201).json({
      message: "Submission created successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
