require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

const User = require("./models/user");
const Report = require("./models/Report");

const TARGET_DATABASE = "abia_clean_city_phase7_test";
const BASE_URL = "http://127.0.0.1:5001/api/reports/admin";
const EXPECTED_USERS = 100;
const EXPECTED_REPORTS = 10000;
const PAGE_SIZE = 20;

let temporaryAdminId = null;
let temporaryAdminEmail = null;
let testsPassed = 0;
let testsFailed = 0;

async function requestEndpoint(label, options = {}) {
    const started = performance.now();

    const response = await fetch(options.url || BASE_URL, {
        method: "GET",
        headers: options.token
            ? { Authorization: `Bearer ${options.token}` }
            : {},
        signal: AbortSignal.timeout(30000)
    });

    const elapsed = Number((performance.now() - started).toFixed(2));
    const body = await response.json();

    return {
        label,
        status: response.status,
        elapsed,
        body
    };
}

async function runTest(name, callback) {
    try {
        const result = await callback();
        testsPassed++;

        console.log(`PASS: ${name}`);

        if (result) {
            console.log(result);
        }
    } catch (error) {
        testsFailed++;
        console.error(`FAIL: ${name}`);
        console.error("Reason:", error.message);
    }
}

async function main() {
    try {
        if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
            throw new Error("Required environment configuration is missing.");
        }

        console.log("\n--- PHASE 7 ADMIN HTTP DIAGNOSTIC ---");

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: TARGET_DATABASE
        });

        if (mongoose.connection.name !== TARGET_DATABASE) {
            throw new Error("Database mismatch. Test aborted.");
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

        const statusDistribution = await Report.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const expectedStatuses = {
            "Pending": 3334,
            "In Progress": 3333,
            "Resolved": 3333
        };

        for (const [status, expectedCount] of Object.entries(expectedStatuses)) {
            const actual = statusDistribution.find(item => item._id === status);

            if (!actual || actual.count !== expectedCount) {
                throw new Error(`Unexpected status distribution for ${status}.`);
            }
        }

        const tenant = await User.findOne({
            name: /^Phase 7 Test User /,
            userType: "tenant"
        });

        if (!tenant) {
            throw new Error("Synthetic tenant account not found.");
        }

        temporaryAdminEmail =
            `phase7-admin-http-${crypto.randomUUID()}@example.invalid`;

        const temporaryAdmin = await User.create({
            name: "Phase 7 Temporary Admin",
            email: temporaryAdminEmail,
            phone: "08000000000",
            address: "Isolated Phase 7 test fixture",
            userType: "admin",
            password: crypto.randomBytes(32).toString("hex")
        });

        temporaryAdminId = temporaryAdmin._id;

        const adminToken = jwt.sign(
            { id: String(temporaryAdmin._id) },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        const tenantToken = jwt.sign(
            { id: String(tenant._id) },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        console.log("\nTemporary admin created in isolated database.");
        console.log("Authentication tokens generated (not displayed).");

        console.log("\n--- HTTP ENDPOINT TESTS ---");

        let pageOne;
        let pageTwo;

        await runTest("Admin can retrieve page 1", async () => {
            pageOne = await requestEndpoint("Page 1", {
                token: adminToken,
                url: `${BASE_URL}?page=1`
            });

            assert.equal(pageOne.status, 200);
            assert.equal(pageOne.body.success, true);
            assert.equal(pageOne.body.reports.length, PAGE_SIZE);
            assert.equal(pageOne.body.pagination.currentPage, 1);
            assert.equal(pageOne.body.pagination.pageSize, PAGE_SIZE);
            assert.equal(pageOne.body.pagination.totalReports, EXPECTED_REPORTS);
            assert.equal(pageOne.body.pagination.totalPages, 500);
            assert.equal(pageOne.body.pagination.hasNextPage, true);
            assert.equal(pageOne.body.pagination.hasPreviousPage, false);

            return `HTTP ${pageOne.status} | ${pageOne.elapsed} ms | 20 reports`;
        });

        await runTest("Admin can retrieve page 2", async () => {
            pageTwo = await requestEndpoint("Page 2", {
                token: adminToken,
                url: `${BASE_URL}?page=2`
            });

            assert.equal(pageTwo.status, 200);
            assert.equal(pageTwo.body.success, true);
            assert.equal(pageTwo.body.reports.length, PAGE_SIZE);
            assert.equal(pageTwo.body.pagination.currentPage, 2);
            assert.equal(pageTwo.body.pagination.hasNextPage, true);
            assert.equal(pageTwo.body.pagination.hasPreviousPage, true);

            return `HTTP ${pageTwo.status} | ${pageTwo.elapsed} ms | 20 reports`;
        });

        await runTest("Status summary matches all 10,000 reports", async () => {
            const counts = pageOne.body.statusCounts;

            assert.equal(counts.pending, 3334);
            assert.equal(counts.inProgress, 3333);
            assert.equal(counts.resolved, 3333);

            return JSON.stringify(counts);
        });

        await runTest("Populated report user information is returned", async () => {
            const firstReport = pageOne.body.reports[0];

            assert.ok(firstReport);
            assert.ok(firstReport.user);
            assert.ok(firstReport.user.name);
            assert.ok(firstReport.user.email);
            assert.equal(firstReport.user.password, undefined);

            return "Report user name/email present; password not exposed.";
        });

        await runTest("Invalid page zero is rejected", async () => {
            const result = await requestEndpoint("Page zero", {
                token: adminToken,
                url: `${BASE_URL}?page=0`
            });

            assert.equal(result.status, 400);
            assert.equal(result.body.success, false);

            return `HTTP ${result.status}`;
        });

        await runTest("Non-numeric page is rejected", async () => {
            const result = await requestEndpoint("Invalid page", {
                token: adminToken,
                url: `${BASE_URL}?page=abc`
            });

            assert.equal(result.status, 400);
            assert.equal(result.body.success, false);

            return `HTTP ${result.status}`;
        });

        await runTest("Page beyond final page is clamped", async () => {
            const result = await requestEndpoint("Out-of-range page", {
                token: adminToken,
                url: `${BASE_URL}?page=9999`
            });

            assert.equal(result.status, 200);
            assert.equal(result.body.pagination.currentPage, 500);
            assert.equal(result.body.pagination.totalPages, 500);
            assert.equal(result.body.pagination.hasNextPage, false);
            assert.equal(result.body.pagination.hasPreviousPage, true);
            assert.equal(result.body.reports.length, PAGE_SIZE);

            return `Requested page 9999; returned page ${result.body.pagination.currentPage}.`;
        });

        await runTest("Unauthenticated request is rejected", async () => {
            const result = await requestEndpoint("No token");

            assert.equal(result.status, 401);

            return `HTTP ${result.status}`;
        });

        await runTest("Tenant cannot access admin endpoint", async () => {
            const result = await requestEndpoint("Tenant access", {
                token: tenantToken
            });

            assert.equal(result.status, 403);

            return `HTTP ${result.status}`;
        });

    } catch (error) {
        testsFailed++;
        console.error("\nDIAGNOSTIC SETUP/EXECUTION ERROR:", error.message);

    } finally {
        console.log("\n--- TEMPORARY ADMIN CLEANUP ---");

        try {
            if (mongoose.connection.readyState === 0 && process.env.MONGO_URI) {
                await mongoose.connect(process.env.MONGO_URI, {
                    dbName: TARGET_DATABASE
                });
            }

            if (temporaryAdminId && temporaryAdminEmail) {
                if (mongoose.connection.name !== TARGET_DATABASE) {
                    throw new Error("Database mismatch. Cleanup aborted.");
                }

                const deletion = await User.deleteOne({
                    _id: temporaryAdminId,
                    email: temporaryAdminEmail,
                    userType: "admin"
                });

                console.log("Temporary admin records deleted:", deletion.deletedCount);

                if (deletion.deletedCount !== 1) {
                    throw new Error("Temporary admin cleanup could not be confirmed.");
                }
            } else {
                console.log("No temporary admin was created; no deletion needed.");
            }

            if (mongoose.connection.readyState === 1) {
                const finalUsers = await User.countDocuments();
                const finalReports = await Report.countDocuments();

                console.log("Final users:", finalUsers);
                console.log("Final reports:", finalReports);

                if (
                    finalUsers !== EXPECTED_USERS ||
                    finalReports !== EXPECTED_REPORTS
                ) {
                    throw new Error("Final dataset counts do not match original counts.");
                }

                console.log("Synthetic dataset counts restored and verified.");
            }

        } catch (cleanupError) {
            testsFailed++;
            console.error("CLEANUP ERROR:", cleanupError.message);
        }

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        console.log("\n--- FINAL RESULT ---");
        console.log("Passed:", testsPassed);
        console.log("Failed:", testsFailed);

        if (testsFailed === 0 && testsPassed === 9) {
            console.log("SUCCESS: All 8 admin HTTP checks passed.");
        } else {
            console.log("DIAGNOSTIC NOT FULLY PASSED. Review failures above.");
            process.exitCode = 1;
        }
    }
}

main();
