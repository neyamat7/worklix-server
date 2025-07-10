const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submissionsController");

router.post("/", submissionController.saveSubmissiosData);
router.get("/check-submission", submissionController.checkSubmissionExists);
router.get("/", submissionController.getSubmissionsPaginated);

module.exports = router;
