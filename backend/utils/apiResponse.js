/* =========================
   SUCCESS RESPONSE
========================= */

const successResponse = (res, statusCode, message, data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...data
    });
};


/* =========================
   ERROR RESPONSE
========================= */

const errorResponse = (res, statusCode, message, extra = {}) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...extra
    });
};


module.exports = {
    successResponse,
    errorResponse
};