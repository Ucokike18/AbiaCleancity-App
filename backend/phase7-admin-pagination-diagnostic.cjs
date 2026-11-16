const path = require("node:path");
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const mongoose = require("mongoose");

const TARGET_DATABASE = "abia_clean_city_phase7_test";
const EXPECTED_REPORTS = 10000;
const PAGE_SIZE = 20;

async function main() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing.");
        }

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: TARGET_DATABASE
        });

        if (mongoose.connection.name !== TARGET_DATABASE) {
            throw new Error("Database isolation check failed.");
        }

        const Report = require("./models/Report");
        const reportCount = await Report.countDocuments();

        if (reportCount !== EXPECTED_REPORTS) {
            throw new Error(
                `Expected ${EXPECTED_REPORTS} reports, found ${reportCount}.`
            );
        }

        console.log("\n--- DATABASE SAFETY CHECK ---");
        console.log("Database:", mongoose.connection.name);
        console.log("Reports:", reportCount);
        console.log("Proposed page size:", PAGE_SIZE);

        console.log("\n--- TEST 1: EXISTING UNBOUNDED ADMIN QUERY ---");

        const unbounded = await Report.find()
            .sort({ createdAt: -1 })
            .explain("executionStats");

        console.log(JSON.stringify({
            winningPlan: unbounded.queryPlanner.winningPlan,
            executionStats: {
                nReturned: unbounded.executionStats.nReturned,
                totalKeysExamined: unbounded.executionStats.totalKeysExamined,
                totalDocsExamined: unbounded.executionStats.totalDocsExamined,
                executionTimeMillis: unbounded.executionStats.executionTimeMillis
            }
        }, null, 2));

        console.log("\n--- TEST 2: PROPOSED PAGINATED ADMIN QUERY ---");

        const paginated = await Report.find()
            .sort({ createdAt: -1 })
            .limit(PAGE_SIZE)
            .explain("executionStats");

        console.log(JSON.stringify({
            winningPlan: paginated.queryPlanner.winningPlan,
            executionStats: {
                nReturned: paginated.executionStats.nReturned,
                totalKeysExamined: paginated.executionStats.totalKeysExamined,
                totalDocsExamined: paginated.executionStats.totalDocsExamined,
                executionTimeMillis: paginated.executionStats.executionTimeMillis
            }
        }, null, 2));

        console.log("\nSUCCESS: Admin pagination diagnostic completed.");
    } catch (error) {
        console.error("\nDIAGNOSTIC FAILED:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

main();
