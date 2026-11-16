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
        status: "Pending",
        createdAt: new Date("2026-10-02T10:00:00Z")
    },
    {
        _id: "report-2",
        user: "tenant-test-id",
        issue: "Overflowing public bin",
        status: "In Progress",
        createdAt: new Date("2026-10-03T10:00:00Z")
    }
];

let originalFindById;
let originalCreate;
let originalFind;
let originalAggregate;
let createdReports;
let adminPopulateCalled;
let adminSkip;
let adminLimit;

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
    originalAggregate = Report.aggregate;

    createdReports = [];
    adminPopulateCalled = false;
    adminSkip = null;
    adminLimit = null;

    // Mock user lookup while keeping real JWT verification.
    User.findById = (userId) => {
        const query = {
            select() {
                return query;
            },
            lean() {
                return Promise.resolve(fakeUsers[String(userId)] || null);
            }
        };

        return query;
    };

    // Mock report creation; no MongoDB records are created.
    Report.create = async (data) => {
        const report = {
            _id: "created-report-" + (createdReports.length + 1),
            user: data.user,
            issue: data.issue,
            status: "Pending",
        };

        createdReports.push(report);
        return report;
    };

    // Mock the query chain used by both report retrieval routes.
    Report.find = (filter) => {
        const query = {
            skipValue: 0,
            limitValue: null,

            populate() {
                adminPopulateCalled = true;
                return this;
            },

            sort(options) {
                this.sortOptions = options;
                return this;
            },

            skip(value) {
                adminSkip = value;
                this.skipValue = value;
                return this;
            },

            limit(value) {
                adminLimit = value;
                this.limitValue = value;
                return this;
            },

            then(resolve, reject) {
                let reports;

                if (!filter || !filter.user) {
                    reports = existingReports;
                } else {
                    reports = existingReports.filter(
                        (report) => report.user === String(filter.user)
                    );
                }

                if (this.sortOptions?.createdAt) {
                    const direction = this.sortOptions.createdAt;

                    reports = [...reports].sort((a, b) => {
                        const dateA = new Date(a.createdAt).getTime();
                        const dateB = new Date(b.createdAt).getTime();

                        return direction === -1
                            ? dateB - dateA
                            : dateA - dateB;
                    });
                }

                const start = this.skipValue;
                const end = this.limitValue === null
                    ? undefined
                    : start + this.limitValue;

                return Promise.resolve(reports.slice(start, end))
                    .then(resolve, reject);
            }
        };

        return query;
    };

    // Mock the aggregate used to calculate all-report statistics.
    Report.aggregate = async () => {
        return [{
            totalReports: existingReports.length,
            pending: existingReports.filter(
                (report) => report.status === "Pending"
            ).length,
            inProgress: existingReports.filter(
                (report) => report.status === "In Progress"
            ).length,
            resolved: existingReports.filter(
                (report) => report.status === "Resolved"
            ).length
        }];
    };
});

test.afterEach(() => {
    User.findById = originalFindById;
    Report.create = originalCreate;
    Report.find = originalFind;
    Report.aggregate = originalAggregate;
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

test("Admins can retrieve paginated reports with summary statistics", async () => {
    const response = await request(app)
        .get("/api/reports/admin")
        .set(authorize("admin-test-id"));

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);

    // Report records
    assert.equal(response.body.reports.length, 2);
    // Reports must be returned newest first.
    assert.equal(
        response.body.reports[0].issue,
        "Overflowing public bin"
    );

    assert.equal(
        response.body.reports[1].issue,
        "Missed waste collection"
    );
    assert.equal(adminPopulateCalled, true);

    // Pagination metadata
    assert.equal(response.body.pagination.currentPage, 1);
    assert.equal(response.body.pagination.pageSize, 20);
    assert.equal(response.body.pagination.totalReports, 2);
    assert.equal(response.body.pagination.totalPages, 1);
    assert.equal(response.body.pagination.hasNextPage, false);
    assert.equal(response.body.pagination.hasPreviousPage, false);

    // Status statistics across all reports
    assert.equal(response.body.statusCounts.pending, 1);
    assert.equal(response.body.statusCounts.inProgress, 1);
    assert.equal(response.body.statusCounts.resolved, 0);

    // Database pagination methods
    assert.equal(adminSkip, 0);
    assert.equal(adminLimit, 20);
});

test("Admins can retrieve the second page of reports", async () => {
    const originalLength = existingReports.length;

    try {
        // Add temporary mock reports to create a second page.
        existingReports.push(
            ...Array.from({ length: 20 }, (_, index) => ({
                _id: `pagination-test-${index + 1}`,
                user: "landlord-test-id",
                issue: `Pagination test report ${index + 1}`,
                status: "Pending",
                createdAt: new Date(
                    Date.UTC(2026, 8, 30 - index)
                )
            }))
        );

        const response = await request(app)
            .get("/api/reports/admin?page=2")
            .set(authorize("admin-test-id"));

        assert.equal(response.status, 200);
        assert.equal(response.body.success, true);

        // The second page should contain the remaining two reports.
        assert.equal(response.body.reports.length, 2);
        assert.equal(
            response.body.reports[0].issue,
            "Pagination test report 19"
        );
        assert.equal(
            response.body.reports[1].issue,
            "Pagination test report 20"
        );

        // Pagination metadata.
        assert.equal(response.body.pagination.currentPage, 2);
        assert.equal(response.body.pagination.pageSize, 20);
        assert.equal(response.body.pagination.totalReports, 22);
        assert.equal(response.body.pagination.totalPages, 2);
        assert.equal(response.body.pagination.hasPreviousPage, true);
        assert.equal(response.body.pagination.hasNextPage, false);

        // Confirm the database query requested the correct offset.
        assert.equal(adminSkip, 20);
        assert.equal(adminLimit, 20);

    } finally {
        // Restore the original fixture after the test.
        existingReports.length = originalLength;
    }
});

test("Admin pagination clamps requests beyond the last page", async () => {
    const originalLength = existingReports.length;

    try {
        existingReports.push(
            ...Array.from({ length: 20 }, (_, index) => ({
                _id: `out-of-range-test-${index + 1}`,
                user: "landlord-test-id",
                issue: `Out of range report ${index + 1}`,
                status: "Pending",
                createdAt: new Date(
                    Date.UTC(2026, 8, 30 - index)
                )
            }))
        );

        const response = await request(app)
            .get("/api/reports/admin?page=999")
            .set(authorize("admin-test-id"));

        assert.equal(response.status, 200);
        assert.equal(response.body.success, true);

        assert.equal(response.body.pagination.currentPage, 2);
        assert.equal(response.body.pagination.totalPages, 2);
        assert.equal(response.body.pagination.totalReports, 22);
        assert.equal(response.body.pagination.hasPreviousPage, true);
        assert.equal(response.body.pagination.hasNextPage, false);

        assert.equal(response.body.reports.length, 2);
        assert.equal(
            response.body.reports[0].issue,
            "Out of range report 19"
        );
        assert.equal(
            response.body.reports[1].issue,
            "Out of range report 20"
        );

        assert.equal(adminSkip, 20);
        assert.equal(adminLimit, 20);

    } finally {
        existingReports.length = originalLength;
    }
});

test("Admin report pagination rejects invalid page numbers", async () => {
    const response = await request(app)
        .get("/api/reports/admin?page=0")
        .set(authorize("admin-test-id"));

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(
        response.body.message,
        "Page must be a positive whole number."
    );
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
