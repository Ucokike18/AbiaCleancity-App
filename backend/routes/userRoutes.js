const protect = require("../middleware/authMiddleware");

const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    getUserProfile
} = require("../controllers/userController");

/* REGISTER */

router.post("/register", registerUser);

/* LOGIN */

/* PROTECTED PROFILE */
router.get("/profile", protect, getUserProfile);

router.post("/login", loginUser);

module.exports = router;