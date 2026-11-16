require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

const User = require("./models/user");
const Report = require("./models/Report");

const TARGET_DATABASE = "abia_clean_city_phase7_test";
const BASE_URL = "http://127.0.0.1:5001/api/reports/admin";

const EXPECTED_USERS = 100;
const EXPECTED_REPORTS = 10000;
const REQUESTS_PER_LEVEL = 30;
const CONCURRENCY_LEVELS = [1, 5, 10];
const WARMUP_REQUESTS = 0;

let temporaryAdminId = null;
let temporaryAdminEmail = null;
let adminToken = null;

function percentile(values, percent) {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(percent * sorted.length) - 1;

    return sorted[Math.max(0, index)];
}

function median(values) {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
}

async function makeRequest() {
    const started = performance.now();

    try {
        const response = await fetch(`${BASE_URL}?page=1`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${adminToken}`
            },
            signal: AbortSignal.timeout(60000)
        });

        const responseText = await response.text();
        const elapsed = performance.now() - started;

        let body = null;

        try {
            body = JSON.parse(responseText);
        } catch {
            // A non-JSON response is recorded as an unsuccessful response.
        }

        if (response.status === 429) {
            console.error("`n--- HTTP 429 DIAGNOSTIC ---");
            console.error({
                message: body?.message || responseText.slice(0, 300),
                rateLimit: response.headers.get("ratelimit"),
                rateLimitPolicy: response.headers.get("ratelimit-policy"),
                rateLimitLimit: response.headers.get("ratelimit-limit"),
                rateLimitRemaining: response.headers.get("ratelimit-remaining"),
                rateLimitReset: response.headers.get("ratelimit-reset"),
                retryAfter: response.headers.get("retry-after")
            });
        }

        const validResponse =
            response.status === 200 &&
            body?.success === true &&
            Array.isArray(body?.reports) &&
            body.reports.length === 20 &&
            body?.pagination?.totalReports === EXPECTED_REPORTS;

        return {
            status: response.status,
            elapsed,
            valid: validResponse,
            error: response.status === 429
                ? body?.message || responseText.slice(0, 300)
                : null
        };
    } catch (error) {
        return {
            status: null,
            elapsed: performance.now() - started,
            valid: false,
            error: error.message
        };
    }
}

async function runConcurrent(totalRequests, concurrency) {
    const results = [];
    let nextIndex = 0;

    const started = performance.now();

    async function worker() {
        while (true) {
            const index = nextIndex++;

            if (index >= totalRequests) return;

            results[index] = await makeRequest();
        }
    }

    const workers = Array.from(
        { length: Math.min(concurrency, totalRequests) },
        () => worker()
    );

    await Promise.all(workers);

    const elapsedSeconds = (performance.now() - started) / 1000;

    return {
        results,
        elapsedSeconds
    };
}

function printResults(concurrency, result) {
    const responses = result.results;
    const successful = responses.filter(item => item.valid);
    const failures = responses.filter(item => !item.valid);
    const networkErrors = responses.filter(item => item.error !== null);

    const statusCounts = {};

    for (const item of responses) {
        const status = item.status === null
            ? "NETWORK_ERROR"
            : String(item.status);

        statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    const durations = responses.map(item => item.elapsed);

    console.log(`\n--- CONCURRENCY ${concurrency} ---`);
    console.log("Total requests:", responses.length);
    console.log("Successful HTTP responses:", successful.length);
    console.log("Failed responses:", failures.length);
    console.log("Network errors:", networkErrors.length);
    console.log("HTTP status distribution:", statusCounts);
    console.log("Elapsed time:", `${(result.elapsedSeconds).toFixed(2)} seconds`);
    console.log(
        "Throughput:",
        `${(responses.length / result.elapsedSeconds).toFixed(2)} requests/second`
    );
    console.log("Median response time:", `${median(durations).toFixed(2)} ms`);
    console.log("P95 response time:", `${percentile(durations, 0.95).toFixed(2)} ms`);
    console.log("Maximum response time:", `${Math.max(...durations).toFixed(2)} ms`);

    return failures.length === 0;
}

async function main() {
    let benchmarkFailed = false;

    try {
        if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
            throw new Error("Required environment configuration is missing.");
        }

        console.log("\n--- PHASE 7 ADMIN HTTP PERFORMANCE BENCHMARK ---");

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: TARGET_DATABASE
        });

        if (mongoose.connection.name !== TARGET_DATABASE) {
            throw new Error("Database mismatch. Benchmark aborted.");
        }

        const initialUsers = await User.countDocuments();
        const initialReports = await Report.countDocuments();

        console.log("Database:", mongoose.connection.name);
        console.log("Initial users:", initialUsers);
        console.log("Initial reports:", initialReports);

        if (
            initialUsers !== EXPECTED_USERS ||
            initialReports !== EXPECTED_REPORTS
        ) {
            throw new Error("Synthetic dataset verification failed.");
        }

        const adminEmail =
            `phase7-admin-bench-${crypto.randomUUID()}@example.invalid`;

        const temporaryAdmin = await User.create({
            name: "Phase 7 Benchmark Admin",
            email: adminEmail,
            phone: "08000000000",
            address: "Isolated Phase 7 benchmark fixture",
            userType: "admin",
            password: crypto.randomBytes(32).toString("hex")
        });

        temporaryAdminId = temporaryAdmin._id;
        temporaryAdminEmail = adminEmail;

        adminToken = jwt.sign(
            { id: String(temporaryAdmin._id) },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        console.log("Temporary admin created.");
        console.log("Authentication token generated privately.");

        await mongoose.disconnect();

        console.log("\n--- WARM-UP ---");

        for (let i = 0; i < WARMUP_REQUESTS; i++) {
            const result = await makeRequest();

            console.log(
                `Warm-up ${i + 1}: HTTP ${result.status} | ` +
                `${result.elapsed.toFixed(2)} ms`
            );

            if (!result.valid) {
                throw new Error(
                    `Warm-up request ${i + 1} failed. Check the isolated API.`
                );
            }
        }

        console.log("\n--- MEASURED BENCHMARKS ---");

        for (const concurrency of CONCURRENCY_LEVELS) {
            const result = await runConcurrent(
                REQUESTS_PER_LEVEL,
                concurrency
            );

            const passed = printResults(concurrency, result);

            if (!passed) {
                benchmarkFailed = true;
            }
        }

        console.log("\n--- BENCHMARK SUMMARY ---");
        console.log("Requests per concurrency level:", REQUESTS_PER_LEVEL);
        console.log("Concurrency levels:", CONCURRENCY_LEVELS.join(", "));
        console.log(
            "Total planned HTTP requests:",
            WARMUP_REQUESTS +
            (REQUESTS_PER_LEVEL * CONCURRENCY_LEVELS.length)
        );

        if (benchmarkFailed) {
            console.log("RESULT: Some measured requests failed.");
        } else {
            console.log("RESULT: All measured requests passed.");
        }
    } catch (error) {
        benchmarkFailed = true;
        console.error("\nBENCHMARK ERROR:", error.message);
    } finally {
        try {
            if (mongoose.connection.readyState !== 1) {
                await mongoose.connect(process.env.MONGO_URI, {
                    dbName: TARGET_DATABASE
                });
            }

            if (mongoose.connection.name !== TARGET_DATABASE) {
                throw new Error("Cleanup database mismatch. Manual verification required.");
            }

            if (temporaryAdminId && temporaryAdminEmail) {
                const cleanup = await User.deleteOne({
                    _id: temporaryAdminId,
                    email: temporaryAdminEmail,
                    userType: "admin"
                });

                console.log("\nTemporary admin accounts deleted:", cleanup.deletedCount);

                if (cleanup.deletedCount !== 1) {
                    benchmarkFailed = true;
                    console.error("WARNING: Temporary admin cleanup was not confirmed.");
                }
            }

            const finalUsers = await User.countDocuments();
            const finalReports = await Report.countDocuments();

            console.log("Final users:", finalUsers);
            console.log("Final reports:", finalReports);

            if (
                finalUsers !== EXPECTED_USERS ||
                finalReports !== EXPECTED_REPORTS
            ) {
                benchmarkFailed = true;
                console.error("WARNING: Final dataset counts do not match.");
            } else {
                console.log("Dataset integrity: PASS");
            }
        } catch (cleanupError) {
            benchmarkFailed = true;
            console.error("CLEANUP ERROR:", cleanupError.message);
        } finally {
            await mongoose.disconnect();
        }

        console.log(
            "\nFINAL RESULT:",
            benchmarkFailed ? "CHECK REQUIRED" : "PASS"
        );

        if (benchmarkFailed) {
            process.exitCode = 1;
        }
    }
}

main();
