const {
    errorResponse
} = require("../utils/apiResponse");

/* =========================
   NOT FOUND HANDLER
========================= */

const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;

    next(error);
};


/* =========================
   GLOBAL ERROR HANDLER
========================= */

const errorHandler = (err, req, res, next) => {

    console.error("API Error:", err);

    const statusCode = err.statusCode || 500;

    return errorResponse(
        res,
        statusCode,
        statusCode === 500
            ? "Internal server error."
            : err.message
    );
};


module.exports = {
    notFound,
    errorHandler
};