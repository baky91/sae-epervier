const express = require("express");
const app = express();
const http = require("http");
const { join } = require("node:path");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

let counterPlayers = 0;
let players = {};

/* example */
// player = {
//   id: 1,
//   name: "Player1",
//   role: "survivor",
//   bonus: {
//     speed: 2,
//     dash: 0,
//   },
// };

io.on("connection", (socket) => {
  const type = socket.handshake.query?.clientType;

  if (type === "player") {
    counterPlayers++;
    socket.join("players_room");
    players[counterPlayers] = socket;

    const name = socket.handshake.query?.name;

    socket.emit("newplayer", {
      player_id: counterPlayers,
      player_name: name,
    });

    console.log("Socked joined players room");
  } else {
    socket.join("host_room");
    console.log("Socked joined host room");
  }

  socket.on("move", (data) => {
    console.log(data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
