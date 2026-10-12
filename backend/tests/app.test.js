
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../app");

test("GET / returns the backend running message", async () => {
    const response = await request(app).get("/");

    assert.equal(response.status, 200);
    assert.equal(response.text, "CleanCity Backend Running...");
});

test("GET /api/health reports an unhealthy status when MongoDB is disconnected", async () => {
    assert.notEqual(mongoose.connection.readyState, 1);

    const response = await request(app).get("/api/health");

    assert.equal(response.status, 503);
    assert.deepEqual(response.body, {
        server: "OK",
        database: "Disconnected",
        status: "Unhealthy"
    });
});

test("Responses include security headers and hide the Express version", async () => {
    const response = await request(app).get("/");

    assert.equal(response.status, 200);
    assert.ok(response.headers["x-content-type-options"]);
    assert.ok(response.headers["x-frame-options"]);
    assert.equal(response.headers["x-powered-by"], undefined);
});


test("Unknown routes return a standardized 404 error response", async () => {
    const path = "/api/test-route-that-does-not-exist";
    const response = await request(app).get(path);

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, `Route not found: ${path}`);
});


test("Protected API endpoints reject requests without a token", async () => {
    const endpoints = [
        { method: "get", path: "/api/users/profile" },
        { method: "get", path: "/api/users/admin/users" },
        { method: "get", path: "/api/payments/admin" },
        { method: "get", path: "/api/payments/admin/summary" },
        { method: "post", path: "/api/reports" },
        { method: "get", path: "/api/reports/my" },
        { method: "get", path: "/api/reports/admin" }
    ];

    for (const endpoint of endpoints) {
        let req = request(app)[endpoint.method](endpoint.path);

        if (endpoint.method === "post") {
            req = req.send({});
        }

        const response = await req;

        assert.equal(
            response.status,
            401,
            `${endpoint.method.toUpperCase()} ${endpoint.path} should reject missing tokens`
        );

        assert.equal(response.body.success, false);
        assert.equal(
            response.body.message,
            "Not authorized. No token provided."
        );
    }
});

test("Registration rejects invalid input without creating a user", async () => {
    const response = await request(app)
        .post("/api/users/register")
        .send({
            name: "",
            email: "not-an-email",
            phone: "",
            address: "x",
            buildingType: "",
            userType: "admin",
            password: "short"
        });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, "Validation failed.");
    assert.ok(Array.isArray(response.body.errors));
    assert.ok(response.body.errors.length > 0);
});

test("Login rejects invalid input without querying for a user", async () => {
    const response = await request(app)
        .post("/api/users/login")
        .send({
            email: "not-an-email",
            password: ""
        });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.message, "Validation failed.");
    assert.ok(Array.isArray(response.body.errors));
    assert.ok(response.body.errors.length > 0);
});


test("Protected endpoints reject malformed JWTs", async () => {
    const response = await request(app)
        .get("/api/users/profile")
        .set("Authorization", "Bearer not-a-valid-jwt");

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(
        response.body.message,
        "Not authorized. Invalid or expired token."
    );
});

test("Protected endpoints reject expired JWTs", async () => {
    const jwt = require("jsonwebtoken");
    const originalSecret = process.env.JWT_SECRET;

    try {
        process.env.JWT_SECRET = "abia-cleancity-test-secret";

        const expiredToken = jwt.sign(
            { id: "507f1f77bcf86cd799439011" },
            process.env.JWT_SECRET,
            { expiresIn: -1 }
        );

        const response = await request(app)
            .get("/api/users/profile")
            .set("Authorization", `Bearer ${expiredToken}`);

        assert.equal(response.status, 401);
        assert.equal(response.body.success, false);
        assert.equal(
            response.body.message,
            "Not authorized. Invalid or expired token."
        );
    } finally {
        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }
    }
});
