const express = require("express");
const app = express();
const http = require("http");
const { join } = require("node:path");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get("/", (req, res) => {
  res.send("<h1>Hello World!</h1>");
});

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
