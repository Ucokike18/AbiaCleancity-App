const {
    errorResponse
} = require("../utils/apiResponse");

/* =========================
   ROLE AUTHORIZATION
========================= */

const authorizeRoles = (...allowedRoles) => {

    return (req, res, next) => {

        if (!req.user) {
            return errorResponse(
                res,
                401,
                "Not authorized."
            );
        }

        const userRole = String(req.user.userType)
            .trim()
            .toLowerCase();

        const permittedRoles = allowedRoles.map(role =>
            String(role).trim().toLowerCase()
        );

        if (!permittedRoles.includes(userRole)) {
            return errorResponse(
                res,
                403,
                "Access denied. You do not have permission to perform this action."
            );
        }

        next();
    };
};

module.exports = authorizeRoles;