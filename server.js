require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contact");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Connect MongoDB
connectDB();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next();
})

// Routes
app.use("/auth", authRoutes);
app.use("/contact", contactRoutes);


// Start Server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
