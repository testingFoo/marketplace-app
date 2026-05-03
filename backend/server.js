const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const activityRoutes = require("./routes/activity.routes");

const Event = require("./models/Event");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.set("io", io);

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("🟢 client connected:", socket.id);
});

// ================= ROUTES (CLEAN CORE ONLY) =================
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/activity", activityRoutes);

// ================= WEATHER (FREE API INTEGRATION) =================
const fetch = require("node-fetch");
const OPENWEATHER_KEY = "YOUR_KEY_HERE";

app.get("/api/weather", async (req, res) => {
  const { lat, lng } = req.query;

  const r = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${OPENWEATHER_KEY}`
  );

  const data = await r.json();

  const event = await Event.create({
    type: "weather",
    severity: data.main.temp > 30 ? 3 : 1,
    location: { lat, lng },
    data: {
      temp: data.main.temp,
      condition: data.weather?.[0]?.main,
      wind: data.wind?.speed
    }
  });

  io.emit("event:new", event);

  res.json(event);
});

// ================= TRAFFIC (SIMPLIFIED LAYER) =================
app.get("/api/traffic", (req, res) => {
  res.json([
    {
      type: "traffic",
      severity: 2,
      location: { lat: 52.2297, lng: 21.0122 }
    }
  ]);
});

// ================= DISASTERS =================
app.get("/api/disasters", (req, res) => {
  res.json([
    {
      type: "disaster",
      severity: 3,
      location: { lat: 52.23, lng: 21.01 }
    }
  ]);
});

// ================= EVENTS FEED =================
app.get("/api/events", async (req, res) => {
  const events = await Event.find().sort({ createdAt: -1 }).limit(100);
  res.json(events);
});

// ================= DB =================
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("🟢 Mongo connected");
});

// ================= START =================
server.listen(5000, () => {
  console.log("🚀 Server running on 5000");
});
