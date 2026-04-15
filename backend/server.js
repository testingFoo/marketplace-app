const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "https://marketplace-app-kohl.vercel.app"
}));

// PORT (Render provides this)
const PORT = process.env.PORT || 3000;

---

# 🧠 MongoDB Connection

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

---

# 🚗 Ride Schema

const rideSchema = new mongoose.Schema({
  pickup: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: [
      "REQUESTED",
      "ACCEPTED",
      "ARRIVING",
      "IN_PROGRESS",
      "COMPLETED"
    ],
    default: "REQUESTED"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Ride = mongoose.model("Ride", rideSchema);

---

# 🏠 Health Check

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

---

# 🏠 Root Route

app.get("/", (req, res) => {
  res.send("Uber Backend Running 🚀");
});

---

# 🚗 Create Ride (MongoDB)

app.post("/api/ride", async (req, res) => {
  try {
    const { pickup, destination } = req.body;

    if (!pickup || !destination) {
      return res.status(400).json({
        error: "pickup and destination required"
      });
    }

    const ride = await Ride.create({
      pickup,
      destination
    });

    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

---

# 🔄 Update Ride Status (Uber Logic)

app.patch("/api/ride/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const ride = await Ride.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

---

# 📊 Get All Rides

app.get("/api/rides", async (req, res) => {
  try {
    const rides = await Ride.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

---

# 🚀 Start Server

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
