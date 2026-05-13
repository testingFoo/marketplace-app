const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.routes");
const eventRoutes = require("./routes/event.routes");
const userRoutes = require("./routes/user.routes");
const searchRoutes = require("./routes/search.routes");
const globalRoutes = require("./routes/global.routes");
const walletRoutes = require("./routes/wallet.routes");

const { fetchGlobalEvents } = require("./services/global.service");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.set("io", io);

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("🟢 client connected:", socket.id);
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/user", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/global", globalRoutes);
app.use("/api/wallet", walletRoutes);

// ================= DB =================
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("🟢 Mongo connected");

  setInterval(async () => {
    try {
      const events = await fetchGlobalEvents();
      io.emit("global:update", events);
      console.log("🌍 Global sync:", events.length);
    } catch (err) {
      console.log("Global sync error:", err.message);
    }
  }, 10 * 60 * 1000);
});

// ================= START =================
server.listen(5000, () => {
  console.log("🚀 Server running on 5000");
});
