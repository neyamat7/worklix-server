const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const tasksCollection = getDB().collection("tasks");

exports.addNewTask = async (req, res) => {
  try {
    const {
      buyer_email,
      task_title,
      task_detail,
      required_workers,
      payable_amount,
      completion_date,
      submission_info,
      task_image_url,
    } = req.body;

    // Validate required fields
    if (
      !buyer_email ||
      !task_title ||
      !task_detail ||
      !required_workers ||
      !payable_amount ||
      !completion_date ||
      !submission_info
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    console.log(req.body.completion_date);

    // Convert numeric fields safely
    const totalWorkers = parseInt(required_workers);
    const amountPerWorker = parseFloat(payable_amount);

    if (isNaN(totalWorkers) || isNaN(amountPerWorker)) {
      return res.status(400).json({ message: "Invalid numeric values." });
    }

    // Calculate total payable amount
    const totalPayableAmount = totalWorkers * amountPerWorker;

    // Create the task object
    const now = new Date();
    const newTask = {
      buyer_email,
      task_title,
      task_detail,
      task_image_url: task_image_url || "",
      submission_info,
      total_workers: totalWorkers,
      required_workers: totalWorkers,
      payable_amount: amountPerWorker,
      total_payable_amount: totalPayableAmount,
      total_paid_workers: 0,
      total_paid_amount: 0,
      completion_date: new Date(completion_date),
      created_at: now,
      status: "active",
      tags: [], // Optional - empty array
      notes: "", // Optional
    };

    // Insert into MongoDB
    const result = await tasksCollection.insertOne(newTask);

    res.status(201).json({
      message: "Task created successfully.",
      taskId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
