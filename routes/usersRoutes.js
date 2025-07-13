const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");

router.post("/", usersController.createUser);
// router.get("/search", usersController.searchUserByEmail);

// get all users
router.get("/", usersController.getAllUsers);

router.get("/single-user", usersController.getUserByExactEmail);

router.get("/role", usersController.getUserRole);

// Get top workers
router.get("/top-workers", usersController.getTopWorkers);

// update user role
router.patch("/:id/role", usersController.updateUserRole);

// delete user
router.delete("/:id/delete", usersController.deleteUser);

module.exports = router;
