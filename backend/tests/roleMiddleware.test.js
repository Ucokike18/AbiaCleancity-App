const test = require("node:test");
const assert = require("node:assert/strict");

const authorizeRoles = require("../middleware/roleMiddleware");

const createResponse = () => {
    const response = {
        statusCode: null,
        body: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(payload) {
            this.body = payload;
            return this;
        }
    };

    return response;
};

test("Authorization rejects requests without a user", () => {
    const response = createResponse();
    let nextCalled = false;

    authorizeRoles("admin")(
        {},
        response,
        () => {
            nextCalled = true;
        }
    );

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, {
        success: false,
        message: "Not authorized."
    });
    assert.equal(nextCalled, false);
});

test("Authorization denies residents access to admin-only actions", () => {
    const response = createResponse();
    let nextCalled = false;

    authorizeRoles("admin")(
        { user: { userType: "resident" } },
        response,
        () => {
            nextCalled = true;
        }
    );

    assert.equal(response.statusCode, 403);
    assert.deepEqual(response.body, {
        success: false,
        message: "Access denied. You do not have permission to perform this action."
    });
    assert.equal(nextCalled, false);
});

test("Authorization allows an administrator to access admin-only actions", () => {
    const response = createResponse();
    let nextCalled = false;

    authorizeRoles("admin")(
        { user: { userType: "admin" } },
        response,
        () => {
            nextCalled = true;
        }
    );

    assert.equal(response.statusCode, null);
    assert.equal(response.body, null);
    assert.equal(nextCalled, true);
});

test("Authorization normalizes role names before checking permissions", () => {
    const response = createResponse();
    let nextCalled = false;

    authorizeRoles(" ADMIN ")(
        { user: { userType: " admin " } },
        response,
        () => {
            nextCalled = true;
        }
    );

    assert.equal(nextCalled, true);
    assert.equal(response.statusCode, null);
});

test("Authorization allows landlords to access report actions", () => {
    const response = createResponse();
    let nextCalled = false;

    authorizeRoles("landlord", "tenant")(
        { user: { userType: "landlord" } },
        response,
        () => {
            nextCalled = true;
        }
    );

    assert.equal(nextCalled, true);
    assert.equal(response.statusCode, null);
});

test("Authorization allows tenants to access report actions", () => {
    const response = createResponse();
    let nextCalled = false;

    authorizeRoles("landlord", "tenant")(
        { user: { userType: "tenant" } },
        response,
        () => {
            nextCalled = true;
        }
    );

    assert.equal(nextCalled, true);
    assert.equal(response.statusCode, null);
});

test("Authorization rejects the unsupported resident role for report actions", () => {
    const response = createResponse();
    let nextCalled = false;

    authorizeRoles("landlord", "tenant")(
        { user: { userType: "resident" } },
        response,
        () => {
            nextCalled = true;
        }
    );

    assert.equal(response.statusCode, 403);
    assert.equal(response.body.success, false);
    assert.equal(nextCalled, false);
});
