const express = require("express");
const http = require("http");
const session = require("express-session");

const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const passport = require("./auth/passport");
const rideRoutes = require("./routes/ride.routes");
const authRoutes = require("./routes/auth.routes");
const driverRoutes = require("./routes/driver.routes");


const app = express();
app.use(express.static("public"));

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(session({
  secret: "super-secret",
  resave: false,
  saveUninitialized: false
}));


// 🔥 REQUEST LOGGER
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ================= ROUTES =================
app.use("/api/rides", rideRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/driver", driverRoutes);

// ================= HTTP SERVER =================
const server = http.createServer(app);

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: { origin: "*" }
});

// 🔥 attach io to express (CRITICAL)
app.set("io", io);

// ================= SOCKET EVENTS =================
require("./sockets")(io);

// (optional direct connection log - keep both is fine)
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// ================= DB =================
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
