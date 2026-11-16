require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const Report = require("./models/Report");

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "abia_clean_city_phase7_test"
        });

        if (mongoose.connection.name !== "abia_clean_city_phase7_test") {
            throw new Error("Database mismatch. Check aborted.");
        }

        const results = await Report.aggregate([
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

        console.log("\n--- ISOLATED DATABASE STATUS DISTRIBUTION ---");
        console.table(results);

    } catch (error) {
        console.error("STATUS CHECK FAILED:", error.message);
        process.exitCode = 1;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
})();
