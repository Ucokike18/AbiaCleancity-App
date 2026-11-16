const http = require("node:http");
const path = require("node:path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const TARGET_DATABASE = "abia_clean_city_phase7_test";
const TEST_PORT = 5001;
const TOTAL_REQUESTS = 40;
const CONCURRENCY = 10;
const REQUEST_TIMEOUT = 30000;

const endpoints = [
    "/api/users/profile",
    "/api/reports/my"
];

function percentile(values, p) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.ceil(p * sorted.length) - 1];
}

function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2;
}

function request(endpoint, token) {
    return new Promise((resolve) => {
        const started = performance.now();
        let settled = false;

        function finish(result) {
            if (settled) return;
            settled = true;

            resolve({
                endpoint,
                durationMs: performance.now() - started,
                ...result
            });
        }

        const req = http.get({
            hostname: "127.0.0.1",
            port: TEST_PORT,
            path: endpoint,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Cache-Control": "no-cache"
            }
        }, (res) => {
            let bytes = 0;

            res.on("data", chunk => {
                bytes += chunk.length;
            });

            res.on("end", () => {
                finish({
                    status: res.statusCode,
                    bytes
                });
            });

            res.on("aborted", () => {
                finish({ error: "Response aborted" });
            });
        });

        req.setTimeout(REQUEST_TIMEOUT, () => {
            req.destroy(new Error("Request timeout"));
        });

        req.on("error", error => {
            finish({ error: error.message });
        });
    });
}

async function main() {
    let token;

    try {
        if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
            throw new Error("Required environment configuration is missing.");
        }

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: TARGET_DATABASE
        });

        if (mongoose.connection.name !== TARGET_DATABASE) {
            throw new Error("Database safety check failed.");
        }

        const User = require("./models/user");

        const user = await User.findOne({
            name: /^Phase 7 Test User /,
            userType: "tenant"
        }).select("_id");

        if (!user) {
            throw new Error("Synthetic tenant test user was not found.");
        }

        token = jwt.sign(
            { id: String(user._id) },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        console.log("Synthetic authentication token generated.");
        console.log("Target database:", TARGET_DATABASE);

    } finally {
        await mongoose.disconnect();
    }

    const tasks = Array.from(
        { length: TOTAL_REQUESTS },
        (_, i) => endpoints[i % endpoints.length]
    );

    const results = [];
    let nextTask = 0;

    const started = performance.now();

    async function worker() {
        while (nextTask < tasks.length) {
            const index = nextTask++;
            results.push(await request(tasks[index], token));
        }
    }

    await Promise.all(
        Array.from(
            { length: CONCURRENCY },
            () => worker()
        )
    );

    const totalDuration = performance.now() - started;

    console.log("\n--- PHASE 7 MIXED API PERFORMANCE RESULTS ---");
    console.log("Total requests:", results.length);
    console.log("Concurrency:", CONCURRENCY);
    console.log("Duration (ms):", totalDuration.toFixed(2));
    console.log(
        "Throughput (requests/sec):",
        (results.length / (totalDuration / 1000)).toFixed(2)
    );

    const statusCounts = {};

    for (const result of results) {
        const key = result.status || "NETWORK_ERROR";
        statusCounts[key] = (statusCounts[key] || 0) + 1;
    }

    console.log("\n--- HTTP STATUS DISTRIBUTION ---");
    console.table(statusCounts);

    console.log("\n--- ENDPOINT PERFORMANCE ---");

    for (const endpoint of endpoints) {
        const group = results.filter(r => r.endpoint === endpoint);
        const successful = group.filter(r => r.status === 200);
        const latencies = group.map(r => r.durationMs);

        console.log("\nEndpoint:", endpoint);
        console.log("Requests:", group.length);
        console.log("HTTP 200:", successful.length);
        console.log(
            "Other HTTP responses:",
            group.length - successful.length
        );
        console.log(
            "Network errors:",
            group.filter(r => r.error).length
        );
        console.log("Median latency (ms):", median(latencies)?.toFixed(2));
        console.log("P95 latency (ms):", percentile(latencies, 0.95)?.toFixed(2));
        console.log("Maximum latency (ms):", Math.max(...latencies).toFixed(2));
    }

    console.log("\n--- TEST COMPLETED ---");
}

main().catch(async error => {
    console.error("\nTEST STOPPED:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
});
