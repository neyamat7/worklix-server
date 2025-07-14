const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const {
  verifyFirebaseToken,
  verifyTokenEmail,
} = require("../middlewares/auth");
const { verifyAdmin } = require("../middlewares/role");

router.post("/", usersController.createUser);
// router.get("/search", usersController.searchUserByEmail);

// get all users
router.get(
  "/",
  verifyFirebaseToken,
  verifyAdmin(),
  usersController.getAllUsers
);

router.get(
  "/single-user",
  verifyFirebaseToken,
  verifyTokenEmail,
  usersController.getUserByExactEmail
);

router.get("/role", verifyFirebaseToken, usersController.getUserRole);

// update user role
router.patch(
  "/:id/role",
  verifyFirebaseToken,
  verifyAdmin(),
  usersController.updateUserRole
);

// delete user
router.delete(
  "/:id/delete",
  verifyFirebaseToken,
  verifyAdmin(),
  usersController.deleteUser
);

module.exports = router;
