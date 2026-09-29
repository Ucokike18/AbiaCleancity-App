const rateLimit = require("express-rate-limit");
const protect = require("../middleware/authMiddleware");
const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    getUserProfile
} = require("../controllers/userController");

/* AUTHENTICATION RATE LIMITER */

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later."
    }
});

/* REGISTER */

router.post(
    "/register",
    authLimiter,
    registerUser
);

/* LOGIN */

router.post(
    "/login",
    authLimiter,
    loginUser
);

/* PROTECTED PROFILE */

router.get(
    "/profile",
    protect,
    getUserProfile
);

module.exports = router;