
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
