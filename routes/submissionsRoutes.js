const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submissionsController");
const { verifyFirebaseToken } = require("../middlewares/auth");
const { verifyWorker, verifyBuyer } = require("../middlewares/role");

router.post(
  "/",
  verifyFirebaseToken,
  verifyWorker(),
  submissionController.saveSubmissionsData
);

router.get(
  "/check-submission",
  verifyFirebaseToken,
  verifyWorker(),
  submissionController.checkSubmissionExists
);

router.get(
  "/",
  verifyFirebaseToken,
  verifyWorker(),
  submissionController.getSubmissionsPaginated
);

// get all submissions by worker_email
router.get(
  "/worker-submissions",
  verifyFirebaseToken,
  verifyWorker(),
  submissionController.getWorkersSubmissions
);

// get buyer's pending submissions by buyer_email
router.get(
  "/pending-submissions",
  verifyFirebaseToken,
  verifyBuyer(),
  submissionController.getPendingSubmissions
);

// approve submission
router.patch(
  "/:id/approve",
  verifyFirebaseToken,
  verifyBuyer(),
  submissionController.approveSubmission
);

// reject submission
router.patch(
  "/:id/reject",
  verifyFirebaseToken,
  verifyBuyer(),
  submissionController.rejectSubmission
);

module.exports = router;
