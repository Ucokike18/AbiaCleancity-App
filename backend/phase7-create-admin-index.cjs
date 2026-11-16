const path = require("node:path");
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const mongoose = require("mongoose");

const TARGET_DATABASE = "abia_clean_city_phase7_test";
const EXPECTED_REPORTS = 10000;

async function main() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing.");
        }

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: TARGET_DATABASE
        });

        if (mongoose.connection.name !== TARGET_DATABASE) {
            throw new Error(
                `Wrong database: ${mongoose.connection.name}`
            );
        }

        const Report = require("./models/Report");
        const reportCount = await Report.countDocuments();

        if (reportCount !== EXPECTED_REPORTS) {
            throw new Error(
                `Safety check failed. Expected ${EXPECTED_REPORTS}, found ${reportCount}.`
            );
        }

        console.log("\n--- DATABASE SAFETY CHECK ---");
        console.log("Database:", mongoose.connection.name);
        console.log("Reports:", reportCount);

        console.log("\n--- CREATING ADMIN SORT INDEX ---");

        const indexName = await Report.collection.createIndex(
            { createdAt: -1 },
            { name: "createdAt_-1" }
        );

        console.log("Index created or already exists:", indexName);

        console.log("\n--- VERIFIED REPORT INDEXES ---");

        const indexes = await Report.collection.indexes();

        for (const index of indexes) {
            console.log({
                name: index.name,
                keys: index.key
            });
        }

        console.log("\nSUCCESS: Admin sort index verification completed.");
    } catch (error) {
        console.error("\nDIAGNOSTIC FAILED:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

main();
