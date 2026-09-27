const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* =========================
   GENERATE JWT TOKEN
========================= */

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

/* =========================
   REGISTER USER
========================= */

const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            address,
            buildingType,
            userType,
            password
        } = req.body;

        /* REQUIRED FIELDS */

        if (
            !name ||
            !email ||
            !phone ||
            !address ||
            !buildingType ||
            !userType ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "All registration fields are required"
            });
        }

        /* NORMALIZE EMAIL */

        const normalizedEmail = email.trim().toLowerCase();

        /* EMAIL VALIDATION */

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        /* PASSWORD VALIDATION */

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        /* CHECK EXISTING USER */

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        /* HASH PASSWORD */

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);

        /* CREATE USER */

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            address: address.trim(),
            buildingType: buildingType.trim(),
            userType: userType.trim(),
            password: hashedPassword
        });

        /* SUCCESS RESPONSE */

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                buildingType: user.buildingType,
                userType: user.userType,
                paymentStatus: user.paymentStatus
            }
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to register user"
        });
    }
};

/* =========================
   LOGIN USER
========================= */

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        /* REQUIRED FIELDS */

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        /* NORMALIZE EMAIL */

        const normalizedEmail = email.trim().toLowerCase();

        /* FIND USER */

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        /* CHECK PASSWORD */

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        /* SUCCESS RESPONSE */

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                buildingType: user.buildingType,
                userType: user.userType,
                paymentStatus: user.paymentStatus
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to login"
        });
    }
};

/* =========================
   GET USER PROFILE
========================= */

const getUserProfile = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            user: req.user
        });

    } catch (error) {
        console.error("Profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve profile"
        });
    }
};

/* =========================
   EXPORT CONTROLLERS
========================= */

module.exports = {
    registerUser,
    loginUser,
    getUserProfile
};