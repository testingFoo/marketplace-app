const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const rideRoutes = require("./routes/ride.routes");
const authRoutes = require("./routes/auth.routes");
const driverRoutes = require("./routes/driver.routes");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// 🔥 REQUEST LOGGER (VERY IMPORTANT)
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ================= ROUTES =================
app.use("/api/rides", rideRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/driver", driverRoutes);

// ================= HTTP + SOCKET =================
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.set("io", io);

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// ================= DEBUG ENDPOINT (FRONTEND USE) =================
app.get("/api/debug", (req, res) => {
  res.json({
    server: "running",
    socketClients: io.engine.clientsCount
  });
});

// ================= DB CONNECTION =================
mongoose.set("debug", true);

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("🟢 Mongo connected");

    app.get("/api/debug/db", (req, res) => {
      res.json({
        status: "connected",
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState
      });
    });
  })
  .catch(err => {
    console.log("🔴 Mongo error:", err);

    app.get("/api/debug/db", (req, res) => {
      res.status(500).json({
        status: "disconnected",
        error: err.message
      });
    });
  });

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.log("🔥 GLOBAL ERROR:", err);

  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
