const Payment = require("../models/Payment");
const {
    successResponse
} = require("../utils/apiResponse");

/* =========================
   GET ADMIN PAYMENTS
========================= */

const getAdminPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate("user", "name email")
            .sort({
                paymentDate: -1
            });

        return successResponse(
            res,
            200,
            "Payments retrieved successfully.",
            {
                payments
            }
        );

    } catch (error) {
        console.error("Admin payments error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve payments"
        });
    }
};

/* =========================
   GET PAYMENT SUMMARY
========================= */

const getPaymentSummary = async (req, res) => {
    try {
        const summary = await Payment.aggregate([
            {
                $group: {
                    _id: null,

                    totalAmount: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: ["$status", "Paid"]
                                },
                                "$amount",
                                0
                            ]
                        }
                    },

                    paidCount: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: ["$status", "Paid"]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    pendingCount: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: ["$status", "Pending"]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    failedCount: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: ["$status", "Failed"]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const result = summary[0] || {
            totalAmount: 0,
            paidCount: 0,
            pendingCount: 0,
            failedCount: 0
        };

        return successResponse(
            res,
            200,
            "Payment summary retrieved successfully.",
            {
                summary: result
            }
        );

    } catch (error) {
        console.error("Payment summary error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve payment summary"
        });
    }
};

module.exports = {
    getAdminPayments,
    getPaymentSummary
};
