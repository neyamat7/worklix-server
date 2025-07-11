const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submissionsController");

router.post("/", submissionController.saveSubmissionsData);
router.get("/check-submission", submissionController.checkSubmissionExists);
router.get("/", submissionController.getSubmissionsPaginated);

// get buyer's pending submissions by buyer_email

router.get("/pending-submissions", submissionController.getPendingSubmissions);

// approve submission
router.patch("/:id/approve", submissionController.approveSubmission);

module.exports = router;
