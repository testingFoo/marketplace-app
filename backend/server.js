const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());

// CORS (safe for now, tighten later when using Vercel domain)
app.use(cors({
  origin: "*"
}));

// PORT for Render
const PORT = process.env.PORT || 3000;

// Health check route (Render uses this for debugging)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Create ride (fake Uber logic)
app.post("/api/ride", (req, res) => {
  const { pickup, destination } = req.body;

  if (!pickup || !destination) {
    return res.status(400).json({
      error: "pickup and destination are required"
    });
  }

  const ride = {
    id: Math.floor(Math.random() * 10000),
    pickup,
    destination,
    status: "driver searching..."
  };

  res.json(ride);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
