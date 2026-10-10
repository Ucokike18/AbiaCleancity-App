const Report = require("../models/Report");
const {
    successResponse
} = require("../utils/apiResponse");

/* =========================
   CREATE WASTE REPORT
========================= */

const createReport = async (req, res) => {
    try {
        const issue =
            typeof req.body.issue === "string"
                ? req.body.issue.trim()
                : "";

        if (!issue) {
            return res.status(400).json({
                success: false,
                message: "Please describe the waste issue."
            });
        }

        if (issue.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "The waste report cannot exceed 2000 characters."
            });
        }

        const report = await Report.create({
            user: req.user._id,
            issue
        });

        return successResponse(
            res,
            201,
            "Waste report submitted successfully.",
            {
                report
            }
        );

    } catch (error) {
        console.error("Create report error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit waste report."
        });
    }
};

/* =========================
   GET RESIDENT REPORTS
========================= */

const getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({
            user: req.user._id
        }).sort({
            createdAt: -1
        });

        return successResponse(
            res,
            200,
            "Your waste reports were retrieved successfully.",
            {
                reports
            }
        );

    } catch (error) {
        console.error("Get resident reports error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve your waste reports."
        });
    }
};

/* =========================
   GET ALL REPORTS (ADMIN)
========================= */

const getAdminReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate("user", "name email address")
            .sort({
                createdAt: -1
            });

        return successResponse(
            res,
            200,
            "Waste reports retrieved successfully.",
            {
                reports
            }
        );

    } catch (error) {
        console.error("Admin reports error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve waste reports."
        });
    }
};

module.exports = {
    createReport,
    getMyReports,
    getAdminReports
};
