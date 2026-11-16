const path = require("node:path");
const dns = require("node:dns");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

const TARGET_DATABASE = "abia_clean_city_phase7_test";
const TEST_PORT = 5001;
const EXPECTED_USERS = 100;
const EXPECTED_REPORTS = 10000;

async function startTestServer() {
    try {
        if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
            throw new Error("Required environment configuration is missing.");
        }

        console.log("\n--- PHASE 7 TEST SERVER ---");

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: TARGET_DATABASE
        });

        console.log("Database connected:", mongoose.connection.readyState === 1);
        console.log("Database name:", mongoose.connection.name);

        if (mongoose.connection.name !== TARGET_DATABASE) {
            throw new Error("Database mismatch. Server startup aborted.");
        }

        const User = require("./models/user");
        const Report = require("./models/Report");

        const userCount = await User.countDocuments();
        const reportCount = await Report.countDocuments();

        console.log("\n--- SYNTHETIC DATA VERIFICATION ---");
        console.log("Users:", userCount);
        console.log("Reports:", reportCount);

        if (
            userCount !== EXPECTED_USERS ||
            reportCount !== EXPECTED_REPORTS
        ) {
            throw new Error("Synthetic dataset verification failed.");
        }

        const app = require("./app");

        const server = app.listen(TEST_PORT, () => {
            console.log("\n--- TEST SERVER READY ---");
            console.log("Port:", TEST_PORT);
            console.log("Database:", mongoose.connection.name);
            console.log("Health endpoint: http://127.0.0.1:5001/api/health");
            console.log("Profile endpoint: http://127.0.0.1:5001/api/users/profile");
            console.log("Reports endpoint: http://127.0.0.1:5001/api/reports/my");
            console.log("\nProduction server configuration remains unchanged.");
        });

        const shutdown = async () => {
            console.log("\nStopping Phase 7 test server...");

            server.close(async () => {
                await mongoose.disconnect();
                console.log("Test database disconnected.");
                process.exit(0);
            });
        };

        process.once("SIGINT", shutdown);
        process.once("SIGTERM", shutdown);

    } catch (error) {
        console.error("\nTEST SERVER STARTUP FAILED:", error.message);

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        process.exitCode = 1;
    }
}

startTestServer();
