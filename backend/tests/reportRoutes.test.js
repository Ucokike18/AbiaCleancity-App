const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET =
    process.env.JWT_SECRET || "test-only-report-route-secret";

process.env.FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:3000";

const app = require("../app");
const User = require("../models/user");
const Report = require("../models/Report");

const fakeUsers = {
    "landlord-test-id": {
        _id: "landlord-test-id",
        userType: "landlord"
    },
    "tenant-test-id": {
        _id: "tenant-test-id",
        userType: "tenant"
    },
    "admin-test-id": {
        _id: "admin-test-id",
        userType: "admin"
    },
    "resident-test-id": {
        _id: "resident-test-id",
        userType: "resident"
    }
};

const existingReports = [
    {
        _id: "report-1",
        user: "landlord-test-id",
        issue: "Missed waste collection",
        status: "Pending"
    },
    {
        _id: "report-2",
        user: "tenant-test-id",
        issue: "Overflowing public bin",
        status: "In Progress"
    }
];

let originalFindById;
let originalCreate;
let originalFind;
let createdReports;
let adminPopulateCalled;

function makeToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

function authorize(userId) {
    return {
        Authorization: "Bearer " + makeToken(userId)
    };
}

test.beforeEach(() => {
    originalFindById = User.findById;
    originalCreate = Report.create;
    originalFind = Report.find;

    createdReports = [];
    adminPopulateCalled = false;

    // Mock user lookup while keeping real JWT verification.
    User.findById = (userId) => ({
        select: async () => fakeUsers[String(userId)] || null
    });

    // Mock report creation; no MongoDB records are created.
    Report.create = async (data) => {
        const report = {
            _id: "created-report-" + (createdReports.length + 1),
            user: data.user,
            issue: data.issue,
            status: "Pending"
        };

        createdReports.push(report);
        return report;
    };

    // Mock the query chain used by both report retrieval routes.
    Report.find = (filter) => {
        const query = {
            populate() {
                adminPopulateCalled = true;
                return this;
            },

            sort: async () => {
                if (!filter || !filter.user) {
                    return existingReports;
                }

                return existingReports.filter(
                    (report) => report.user === String(filter.user)
                );
            }
        };

        return query;
    };
});

test.afterEach(() => {
    User.findById = originalFindById;
    Report.create = originalCreate;
    Report.find = originalFind;
});

test("Landlord can submit a report through the HTTP route", async () => {
    const response = await request(app)
        .post("/api/reports")
        .set(authorize("landlord-test-id"))
        .send({ issue: "  Missed waste collection  " });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.report.issue, "Missed waste collection");
    assert.equal(
        String(response.body.report.user),
        "landlord-test-id"
    );
    assert.equal(createdReports.length, 1);
});

test("Tenant can submit a report through the HTTP route", async () => {
    const response = await request(app)
        .post("/api/reports")
        .set(authorize("tenant-test-id"))
        .send({ issue: "Overflowing public bin" });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(
        String(response.body.report.user),
        "tenant-test-id"
    );
});

test("Report submission rejects an empty issue", async () => {
    const response = await request(app)
        .post("/api/reports")
        .set(authorize("landlord-test-id"))
        .send({ issue: "   " });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(createdReports.length, 0);
});

test("Users can retrieve only their own reports", async () => {
    const response = await request(app)
        .get("/api/reports/my")
        .set(authorize("landlord-test-id"));

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.reports.length, 1);
    assert.equal(
        response.body.reports[0].user,
        "landlord-test-id"
    );
});

test("Admins can retrieve all reports with user details populated", async () => {
    const response = await request(app)
        .get("/api/reports/admin")
        .set(authorize("admin-test-id"));

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.reports.length, 2);
    assert.equal(adminPopulateCalled, true);
});

test("Unsupported resident role is denied report access", async () => {
    const headers = authorize("resident-test-id");

    const createResponse = await request(app)
        .post("/api/reports")
        .set(headers)
        .send({ issue: "Test report" });

    const myReportsResponse = await request(app)
        .get("/api/reports/my")
        .set(headers);

    assert.equal(createResponse.status, 403);
    assert.equal(myReportsResponse.status, 403);
    assert.equal(createdReports.length, 0);
});

test("Non-admin users cannot retrieve all reports", async () => {
    const response = await request(app)
        .get("/api/reports/admin")
        .set(authorize("tenant-test-id"));

    assert.equal(response.status, 403);
    assert.equal(response.body.success, false);
});
