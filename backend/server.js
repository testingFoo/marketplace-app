const express = require("express");
const http = require("http");

const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const passport = require("passport");

// ================= ROUTES (KEEP CORE ONLY) =================
const activityRoutes = require("./routes/activity.routes");
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const eventRoutes = require("./routes/event.routes");

const Event = require("./models/Event");

const app = express();
app.use(express.static("public"));
app.use(passport.initialize());

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// logger
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ================= CORE ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/events", eventRoutes);

// ================= SERVER =================
const server = http.createServer(app);

// ================= SOCKET =================
const io = new Server(server, {
  cors: { origin: "*" }
});

app.set("io", io);

require("./sockets")(io);

io.on("connection", (socket) => {
  console.log("🟢 connected:", socket.id);
});

// ================= DB =================
mongoose.set("debug", true);

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("🟢 Mongo connected"))
  .catch(err => console.log("🔴 Mongo error:", err));

// ================= CLEAN ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.log("🔥 ERROR:", err);
  res.status(500).json({ error: err.message });
});

// ================= ONLY ONE CORE INTELLIGENCE API =================
// (THIS replaces all debug weather endpoints)

const generateWeather = (lat, lng) => ({
  type: "weather",
  location: { lat, lng },
  data: {
    temperature: 12 + Math.random() * 18,
    windspeed: Math.random() * 25
  }
});

const generateTraffic = (lat, lng) => ({
  type: "traffic",
  location: { lat, lng },
  data: {
    congestion: Math.floor(Math.random() * 100)
  }
});

const generateDisaster = (lat, lng) => ({
  type: "disaster",
  location: { lat, lng },
  data: {
    severity: Math.floor(Math.random() * 5),
    label: "No active disaster"
  }
});

// ================= VIEWPORT INTELLIGENCE =================
app.get("/api/layers/viewport", (req, res) => {
  const lat = parseFloat(req.query.lat) || 52.2297;
  const lng = parseFloat(req.query.lng) || 21.0122;

  const layers = [
    generateWeather(lat, lng),
    generateTraffic(lat, lng),
    generateDisaster(lat, lng)
  ];

  res.json(layers);
});

// ================= START =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
