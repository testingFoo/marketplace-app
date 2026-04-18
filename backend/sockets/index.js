module.exports = (io) => {
  io.on("connection", (socket) => {

    socket.on("driver:location", (data) => {
      io.emit("driver:location:update", data);
    });

  });
};
