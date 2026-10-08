const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getAdminPayments,
    getPaymentSummary
} = require("../controllers/paymentController");

const router = express.Router();

/* =========================
   ADMIN PAYMENTS
========================= */

router.get(
    "/admin",
    protect,
    authorizeRoles("admin"),
    getAdminPayments
);

/* =========================
   PAYMENT SUMMARY
========================= */

router.get(
    "/admin/summary",
    protect,
    authorizeRoles("admin"),
    getPaymentSummary
);

module.exports = router;
