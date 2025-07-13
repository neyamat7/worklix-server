const express = require("express");
const router = express.Router();
const workerController = require("../controllers/workerController");
const { verifyFirebaseToken } = require("../middlewares/auth");
const { verifyWorker } = require("../middlewares/role");

router.get(
  "/tasks-list",
  verifyFirebaseToken,
  verifyWorker(),
  workerController.getTaskList
);
router.get(
  "/task/:taskId",
  verifyFirebaseToken,
  verifyWorker(),
  workerController.getTaskById
);

module.exports = router;
