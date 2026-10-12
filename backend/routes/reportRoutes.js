const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createReport,
    getMyReports,
    getAdminReports
} = require("../controllers/reportController");

const router = express.Router();

/* SUBMIT WASTE REPORT */

router.post(
    "/",
    protect,
    authorizeRoles("landlord", "tenant"),
    createReport
);

/* GET AUTHENTICATED USER'S REPORTS */

router.get(
    "/my",
    protect,
    authorizeRoles("landlord", "tenant"),
    getMyReports
);

/* ADMIN: GET ALL WASTE REPORTS */

router.get(
    "/admin",
    protect,
    authorizeRoles("admin"),
    getAdminReports
);

module.exports = router;
