const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const activityRoutes = require("./routes/activity.routes");
const globalRoutes = require("./routes/global.routes");
const userRoutes = require("./routes/user.routes")
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
app.use("/api/global", globalRoutes);
app.use("/api/user", userRoutes);
app.use("/api/search", require("./routes/search.routes"));

// ================= DB =================
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("🟢 Mongo connected");

  // ================= GLOBAL AUTO SYNC =================

 setInterval(async () => {
    try {

      const {
        fetchGlobalEvents
      } = require("./services/global.service");

      const events = await fetchGlobalEvents();

      io.emit("global:update", events);

      console.log("🌍 Auto sync:", events.length);

    } catch (err) {

      console.log(
        "Global sync error:",
        err.message
      );
    }

  }, 10 * 60 * 1000); // every 10 minutes
});
  

// ================= START =================
server.listen(5000, () => {
  console.log("🚀 Server running on 5000");
});
