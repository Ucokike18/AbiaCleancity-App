const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const bcrypt = require("bcryptjs");
const readline = require("readline");
const path = require("path");
const dotenv = require("dotenv");

const User = require("../models/user");

dotenv.config({
    path: path.resolve(__dirname, "../.env")
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
};

const createAdmin = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not configured.");
        }

        const name = (await askQuestion("Admin name: ")).trim();
        const email = (await askQuestion("Admin email: ")).trim().toLowerCase();
        const phone = (await askQuestion("Admin phone: ")).trim();
        const address = (await askQuestion("Admin address: ")).trim();
        const password = (await askQuestion("Admin password: ")).trim();

        if (!name || !email || !phone || !address || !password) {
            throw new Error("All fields are required.");
        }

        if (password.length < 8) {
            throw new Error("Password must be at least 8 characters.");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected.");

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new Error(
                "A user with this email already exists. Use a different email."
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await User.create({
            name,
            email,
            phone,
            address,
            userType: "admin",
            password: hashedPassword
        });

        console.log(`Admin account created successfully: ${admin.email}`);
    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        rl.close();

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    }
};

createAdmin();
