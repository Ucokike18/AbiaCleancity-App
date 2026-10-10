const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const reportRoutes = require("./routes/reportRoutes");

require("dotenv").config();

/* REQUIRED ENVIRONMENT VARIABLES */

const requiredEnvVariables = [
    "MONGO_URI",
    "JWT_SECRET",
    "FRONTEND_URL"
];

for (const variable of requiredEnvVariables) {
    if (!process.env[variable]) {
        console.error(`Missing required environment variable: ${variable}`);
        process.exit(1);
    }
}

/* DATABASE CONNECTION */
const connectDB = require("./config/db");

/* ROUTES */
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

/* INITIALIZE EXPRESS */
const app = express();

/* SECURITY */

app.disable("x-powered-by");

/* RATE LIMITING */

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later."
    }
});

const {
    notFound,
    errorHandler
} = require("./middleware/errorMiddleware");

/* CONNECT TO DATABASE */
connectDB();

/* MIDDLEWARE */

const allowedOrigin = process.env.FRONTEND_URL;

app.use(helmet());

app.use(
    cors({
        origin: allowedOrigin
    })
);

app.use(
    express.json({
        limit: "10kb"
    })
);

/* TEST ROUTE */
app.get("/", (req, res) => {
    res.send("CleanCity Backend Running...");
});

/* HEALTH CHECK */
app.get("/api/health", (req, res) => {

    const databaseConnected = mongoose.connection.readyState === 1;

    res.status(databaseConnected ? 200 : 503).json({
        server: "OK",
        database: databaseConnected ? "Connected" : "Disconnected",
        status: databaseConnected ? "Healthy" : "Unhealthy"
    });
});

/* API ROUTES */
app.use("/api", apiLimiter);

app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);

/* ERROR HANDLING */

app.use(notFound);

app.use(errorHandler);

/* PORT */
const PORT = process.env.PORT || 5000;

/* START SERVER */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
