const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* GENERATE JWT TOKEN */

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

        /* CHECK EXISTING USER */

        const existingUser = await User.findOne({ email });

        if(existingUser){

            return res.status(400).json({
                message:"User already exists"
            });
        }

        /* HASH PASSWORD */

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);

        /* CREATE USER */

        const user = await User.create({
            name,
            email,
            phone,
            address,
            buildingType,
            userType,
            password: hashedPassword
        });

        /* RESPONSE */

        res.status(201).json({

            message:"User registered successfully",

            token: generateToken(user._id),

            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address,
                buildingType:user.buildingType,
                userType:user.userType
            }
        });

    } catch(error){

        res.status(500).json({
            message:error.message
        });
    }
};

/* =========================
   LOGIN USER
========================= */

const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        /* FIND USER */

        const user = await User.findOne({ email });

        if(!user){

            return res.status(400).json({
                message:"Invalid email or password"
            });
        }

        /* CHECK PASSWORD */

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){

            return res.status(400).json({
                message:"Invalid email or password"
            });
        }

        /* SUCCESS RESPONSE */

        res.status(200).json({

            message:"Login successful",

            token: generateToken(user._id),

            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address,
                buildingType:user.buildingType,
                userType:user.userType,
                paymentStatus:user.paymentStatus
            }
        });

    } catch(error){

        res.status(500).json({
            message:error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser
};