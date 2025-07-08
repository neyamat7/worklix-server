const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");

router.post("/", usersController.createUser);
router.get("/search", usersController.getUserByEmail);
router.get("/role", usersController.getUserRole);
router.patch("/:id/role", usersController.updateUserRole);

module.exports = router;
