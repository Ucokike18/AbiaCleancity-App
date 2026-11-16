const path = require("path");
const dns = require("node:dns");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const User = require("./models/User");
const Report = require("./models/Report");

const TARGET_DATABASE = "abia_clean_city_phase7_test";
const USER_COUNT = 100;
const REPORTS_PER_USER = 100;
const BATCH_SIZE = 1000;

const statuses = ["Pending", "In Progress", "Resolved"];

async function generateTestData() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing.");
        }

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: TARGET_DATABASE
        });

        console.log("\n--- DATABASE SAFETY CHECK ---");
        console.log("Connected:", mongoose.connection.readyState === 1);
        console.log("Database:", mongoose.connection.name);

        if (mongoose.connection.name !== TARGET_DATABASE) {
            throw new Error("Database mismatch. No records will be inserted.");
        }

        const existingCollections =
            await mongoose.connection.db.listCollections().toArray();

        const allowedCollections = ["users", "reports"];

        const unexpectedCollections = existingCollections
            .map(collection => collection.name)
            .filter(name => !allowedCollections.includes(name));

        if (unexpectedCollections.length > 0) {
            throw new Error(
                "Unexpected collections detected: " +
                unexpectedCollections.join(", ") +
                ". Aborting to protect existing data."
            );
        }

        const existingUsers = await User.countDocuments();
        const existingReports = await Report.countDocuments();

        if (existingUsers !== 0 || existingReports !== 0) {
            throw new Error(
                "Existing records detected. Aborting data generation."
            );
        }

        console.log("Safety check passed. Database is empty.");

        await Promise.all([
            User.init(),
            Report.init()
        ]);

        console.log("\n--- GENERATING SYNTHETIC USERS ---");

        const userDocuments = [];

        for (let i = 1; i <= USER_COUNT; i++) {
            const number = String(i).padStart(3, "0");

            userDocuments.push({
                name: "Phase 7 Test User " + number,
                email: "phase7-user-" + number + "@example.invalid",
                phone: "+234800000" + String(i).padStart(4, "0"),
                address: "Phase 7 Test Address " + number,
                buildingType: "Residential",
                userType: i % 2 === 0 ? "tenant" : "landlord",
                password: "PHASE7_SYNTHETIC_RECORD_NOT_FOR_AUTHENTICATION"
            });
        }

        const users = await User.insertMany(userDocuments, {
            ordered: true
        });

        console.log("Users inserted:", users.length);

        console.log("\n--- GENERATING SYNTHETIC REPORTS ---");

        const totalReports = USER_COUNT * REPORTS_PER_USER;
        let insertedReports = 0;

        for (
            let batchStart = 0;
            batchStart < totalReports;
            batchStart += BATCH_SIZE
        ) {
            const batch = [];

            for (
                let i = batchStart;
                i < Math.min(batchStart + BATCH_SIZE, totalReports);
                i++
            ) {
                const userIndex = Math.floor(i / REPORTS_PER_USER);
                const reportNumber = (i % REPORTS_PER_USER) + 1;

                const ageInDays = (i * 37) % 365;
                const createdAt = new Date(
                    Date.now() -
                    ageInDays * 24 * 60 * 60 * 1000
                );

                batch.push({
                    user: users[userIndex]._id,
                    issue:
                        "Phase 7 synthetic waste report " +
                        String(reportNumber).padStart(3, "0") +
                        " for performance testing.",
                    status: statuses[i % statuses.length],
                    createdAt,
                    updatedAt: createdAt
                });
            }

            const inserted = await Report.insertMany(batch, {
                ordered: true
            });

            insertedReports += inserted.length;

            console.log(
                "Reports inserted:",
                insertedReports,
                "/",
                totalReports
            );
        }

        console.log("\n--- FINAL DATA VERIFICATION ---");

        const finalUserCount = await User.countDocuments();
        const finalReportCount = await Report.countDocuments();

        console.log("Database:", mongoose.connection.name);
        console.log("Expected users:", USER_COUNT);
        console.log("Actual users:", finalUserCount);
        console.log("Expected reports:", totalReports);
        console.log("Actual reports:", finalReportCount);

        const reportStatusCounts = await Report.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        console.log("\nReport status distribution:");
        console.table(reportStatusCounts);

        if (
            finalUserCount !== USER_COUNT ||
            finalReportCount !== totalReports
        ) {
            throw new Error("Final record counts do not match expectations.");
        }

        console.log("\nSUCCESS: Synthetic test data generated and verified.");

    } catch (error) {
        console.error("\nDATA GENERATION FAILED:", error.message);
        process.exitCode = 1;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

generateTestData();
