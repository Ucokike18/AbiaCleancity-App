const path = require("node:path");
const dns = require("node:dns");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

const TARGET_DATABASE = "abia_clean_city_phase7_test";
const EXPECTED_USERS = 100;
const EXPECTED_REPORTS = 10000;

async function runDiagnostic() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MongoDB configuration is missing.");
        }

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: TARGET_DATABASE
        });

        console.log("\n--- DATABASE ISOLATION CHECK ---");
        console.log("Connected:", mongoose.connection.readyState === 1);
        console.log("Database:", mongoose.connection.name);

        if (mongoose.connection.name !== TARGET_DATABASE) {
            throw new Error("Database mismatch. Diagnostic aborted.");
        }

        const User = require("./models/User");
        const Report = require("./models/Report");

        const totalUsers = await User.countDocuments();
        const totalReports = await Report.countDocuments();

        console.log("\n--- DATASET VERIFICATION ---");
        console.log("Expected users:", EXPECTED_USERS);
        console.log("Actual users:", totalUsers);
        console.log("Expected reports:", EXPECTED_REPORTS);
        console.log("Actual reports:", totalReports);

        if (
            totalUsers !== EXPECTED_USERS ||
            totalReports !== EXPECTED_REPORTS
        ) {
            throw new Error("Dataset verification failed. Diagnostic aborted.");
        }

        const testUser = await User.findOne({
            name: /^Phase 7 Test User /
        })
            .select("_id name email")
            .sort({ _id: 1 })
            .lean();

        if (!testUser) {
            throw new Error("No synthetic test user was found.");
        }

        const userId = testUser._id;

        console.log("\n--- SELECTED SYNTHETIC USER ---");
        console.log("Name:", testUser.name);
        console.log("Email:", testUser.email);
        console.log("User ID:", userId.toString());

        const personalReportsCount = await Report.countDocuments({
            user: userId
        });

        console.log("Personal reports:", personalReportsCount);

        if (personalReportsCount === 0) {
            throw new Error("Selected synthetic user has no reports.");
        }

        console.log("\n--- EXISTING REPORT INDEXES ---");

        const indexes = await Report.collection.indexes();

        for (const index of indexes) {
            console.log({
                name: index.name,
                keys: index.key,
                unique: index.unique || false
            });
        }

        console.log("\n--- ADMIN REPORT QUERY EXECUTION PLAN ---");

        const adminPlan = await Report.find()
            .sort({ createdAt: -1 })
            .explain("executionStats");

        console.log(JSON.stringify({
            winningPlan: adminPlan.queryPlanner.winningPlan,
            executionStats: {
                nReturned: adminPlan.executionStats.nReturned,
                totalKeysExamined: adminPlan.executionStats.totalKeysExamined,
                totalDocsExamined: adminPlan.executionStats.totalDocsExamined,
                executionTimeMillis: adminPlan.executionStats.executionTimeMillis
            }
        }, null, 2));

        console.log("\n--- PERSONAL REPORT QUERY EXECUTION PLAN ---");

        const personalPlan = await Report.find({
            user: userId
        })
            .sort({ createdAt: -1 })
            .explain("executionStats");

        console.log(JSON.stringify({
            winningPlan: personalPlan.queryPlanner.winningPlan,
            executionStats: {
                nReturned: personalPlan.executionStats.nReturned,
                totalKeysExamined: personalPlan.executionStats.totalKeysExamined,
                totalDocsExamined: personalPlan.executionStats.totalDocsExamined,
                executionTimeMillis: personalPlan.executionStats.executionTimeMillis
            }
        }, null, 2));

        console.log("\nSUCCESS: Both report query diagnostics completed.");

    } catch (error) {
        console.error("\nDiagnostic failed:", error.message);
        process.exitCode = 1;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

runDiagnostic();
