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


// ================= TRAFFIC (SIMPLIFIED LAYER) =================

// ================= DISASTERS =================

// ================= EVENTS FEED =================
// ================= DB =================
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("🟢 Mongo connected");
});

// ================= START =================
server.listen(5000, () => {
  console.log("🚀 Server running on 5000");
});
