const express = require("express");
const cors = require("cors");
require("dotenv").config();

/* DATABASE CONNECTION */
const connectDB = require("./config/db");

/* ROUTES */
const userRoutes = require("./routes/userRoutes");

/* INITIALIZE EXPRESS */
const app = express();

/* CONNECT to DATABASE */
connectDB();

/* MIDDLEWARE */
app.use(cors());
app.use(express.json());

/* TEST ROUTE */
app.get("/", (req, res) => {
    res.send("CleanCity Backend Running...");
});

/* USER ROUTES */
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.send("CleanCity Backend Running...");
});

/* PORT */
const PORT = process.env.PORT || 5000;

/* START SERVER */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});