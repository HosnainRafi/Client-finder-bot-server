// index.js (root)
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");
const jobRoutes = require("./src/routes/job.routes");

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow server to accept JSON in the body of requests

// A simple root route to check if the server is up
app.get("/", (req, res) => {
  res.send("Client Finder API is running...");
});

// API Routes
app.use("/api/jobs", jobRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
