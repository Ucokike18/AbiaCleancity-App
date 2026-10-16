
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET =
    process.env.JWT_SECRET || "test-only-profile-route-secret";

process.env.FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:3000";

const app = require("../app");
const User = require("../models/user");

const fakeUsers = {
    "landlord-test-id": {
        _id: "landlord-test-id",
        name: "Old Name",
        email: "landlord@example.com",
        phone: "08012345678",
        address: "Old Address, Umuahia",
        buildingType: "flat",
        userType: "landlord",
        paymentStatus: "Not Paid"
    },
    "tenant-test-id": {
        _id: "tenant-test-id",
        name: "Tenant User",
        email: "tenant@example.com",
        phone: "08012345679",
        address: "Tenant Address, Umuahia",
        buildingType: "bungalow",
        userType: "tenant",
        paymentStatus: "Not Paid"
    },
    "admin-test-id": {
        _id: "admin-test-id",
        name: "Admin User",
        email: "admin@example.com",
        userType: "admin"
    }
};

let originalFindById;
let originalFindByIdAndUpdate;
let updateCalls;

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
    originalFindByIdAndUpdate = User.findByIdAndUpdate;
    updateCalls = [];

    // Keep real JWT verification but mock user lookup.
    User.findById = (userId) => ({
        select: async () => fakeUsers[String(userId)] || null
    });

    // Mock the database update and Mongoose query chain.
    User.findByIdAndUpdate = (userId, update, options) => {
        updateCalls.push({
            userId: String(userId),
            update,
            options
        });

        const currentUser = fakeUsers[String(userId)];

        const updatedUser = currentUser
            ? {
                ...currentUser,
                ...(update.$set || {})
            }
            : null;

        return {
            select: async () => updatedUser
        };
    };
});

test.afterEach(() => {
    User.findById = originalFindById;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
});

test("Landlord can update their own permitted profile fields", async () => {
    const response = await request(app)
        .put("/api/users/profile")
        .set(authorize("landlord-test-id"))
        .send({
            name: "  Updated Landlord  ",
            phone: "08012345678",
            address: "  New Address, Umuahia  ",
            buildingType: "duplex"
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.user.name, "Updated Landlord");
    assert.equal(response.body.user.address, "New Address, Umuahia");
    assert.equal(response.body.user.buildingType, "duplex");
    assert.equal("password" in response.body.user, false);

    assert.equal(updateCalls.length, 1);
    assert.equal(updateCalls[0].userId, "landlord-test-id");
    assert.deepEqual(
        Object.keys(updateCalls[0].update.$set).sort(),
        ["address", "buildingType", "name", "phone"]
    );
    assert.equal(updateCalls[0].options.new, true);
    assert.equal(updateCalls[0].options.runValidators, true);
});

test("Tenant can update their own profile", async () => {
    const response = await request(app)
        .put("/api/users/profile")
        .set(authorize("tenant-test-id"))
        .send({
            name: "Tenant Updated",
            phone: "08012345679",
            address: "New Tenant Address",
            buildingType: "bungalow"
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.user.name, "Tenant Updated");
    assert.equal(updateCalls[0].userId, "tenant-test-id");
});

test("Profile update requires authentication", async () => {
    const response = await request(app)
        .put("/api/users/profile")
        .send({
            name: "Updated Name",
            phone: "08012345678",
            address: "New Address, Umuahia",
            buildingType: "flat"
        });

    assert.equal(response.status, 401);
    assert.equal(updateCalls.length, 0);
});

test("Profile update rejects invalid building type", async () => {
    const response = await request(app)
        .put("/api/users/profile")
        .set(authorize("landlord-test-id"))
        .send({
            name: "Updated Name",
            phone: "08012345678",
            address: "New Address, Umuahia",
            buildingType: "invalid-type"
        });

    assert.equal(response.status, 400);
    assert.equal(updateCalls.length, 0);
});

test("Profile update rejects an invalid phone number", async () => {
    const response = await request(app)
        .put("/api/users/profile")
        .set(authorize("landlord-test-id"))
        .send({
            name: "Updated Name",
            phone: "123",
            address: "New Address, Umuahia",
            buildingType: "flat"
        });

    assert.equal(response.status, 400);
    assert.equal(updateCalls.length, 0);
});

test("Profile update rejects missing required fields", async () => {
    const response = await request(app)
        .put("/api/users/profile")
        .set(authorize("landlord-test-id"))
        .send({
            name: "Updated Name"
        });

    assert.equal(response.status, 400);
    assert.equal(updateCalls.length, 0);
});

test("Profile update rejects attempts to change protected fields", async () => {
    const protectedFields = [
        "email",
        "userType",
        "paymentStatus",
        "password"
    ];

    for (const field of protectedFields) {
        const payload = {
            name: "Updated Name",
            phone: "08012345678",
            address: "New Address, Umuahia",
            buildingType: "flat",
            [field]: "unauthorized-change"
        };

        const response = await request(app)
            .put("/api/users/profile")
            .set(authorize("landlord-test-id"))
            .send(payload);

        assert.equal(
            response.status,
            400,
            `Expected ${field} modification to be rejected`
        );
    }

    assert.equal(updateCalls.length, 0);
});

test("Admin cannot use the resident profile-update endpoint", async () => {
    const response = await request(app)
        .put("/api/users/profile")
        .set(authorize("admin-test-id"))
        .send({
            name: "Updated Admin",
            phone: "08012345678",
            address: "New Address, Umuahia",
            buildingType: "flat"
        });

    assert.equal(response.status, 403);
    assert.equal(updateCalls.length, 0);
});
