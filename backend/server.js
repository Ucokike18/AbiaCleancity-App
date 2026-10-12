
require("dotenv").config();

const connectDB = require("./config/db");

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

/* EXPRESS APPLICATION */
const app = require("./app");

/* START SERVER */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
