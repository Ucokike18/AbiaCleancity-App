const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ["Paid", "Pending", "Failed"],
        default: "Pending"
    },

    paymentDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Payment", paymentSchema);
