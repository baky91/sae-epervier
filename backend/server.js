const express = require("express");
const http = require("http");
const { join } = require("node:path");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server }); // On lie ws au serveur http

// SECURITE

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.get("/", (req, res) => {
  res.send(
    "<h1>L'épervier masqué - Godot</h1><a href='game'>Game</a><br><a href='controller'>Controller</a>",
  );
});

// FICHIERS STATIQUES

app.use(express.static("public"));
app.use(express.static("game"));

// ROUTES

app.get("/controller", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

app.get("/game", (req, res) => {
  res.sendFile(join(__dirname, "game", "TestExportWeb.html"));
});

let counterPlayers = 0;
let hostSocket = null; // Référence vers l'écran Godot

wss.on("connection", (ws, req) => {
  // Extraction des paramètres de l'URL (ex: ?clientType=player&name=Alex)
  const params = new URLSearchParams(req.url.split("?")[1]);
  const type = params.get("clientType");
  const name = params.get("name") || "Anonyme";

  if (type === "player") {
    counterPlayers++;
    ws.playerId = counterPlayers;
    ws.playerName = name;

    // On confirme au joueur sa création
    ws.send(
      JSON.stringify({
        type: "newplayer",
        data: { player_id: ws.playerId, player_name: ws.playerName },
      }),
    );

    // On prévient le Host (Godot) qu'un joueur est arrivé
    if (hostSocket) {
      hostSocket.send(
        JSON.stringify({
          type: "player_joined",
          data: { id: ws.playerId, name: ws.playerName },
        }),
      );
    }
    console.log(`Joueur ${name} connecté (ID: ${ws.playerId})`);
  } else {
    hostSocket = ws;
    console.log("Écran Godot (Host) connecté");
  }

  // Gestion des messages entrants
  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message);

      // Si c'est un message de mouvement ou bonus, on le relaie à Godot
      if (hostSocket && hostSocket !== ws) {
        hostSocket.send(
          JSON.stringify({
            type: parsed.type, // "move" ou "use_bonus"
            player_id: ws.playerId,
            data: parsed.data,
          }),
        );
      }
    } catch (e) {
      console.error("Erreur format JSON :", e);
    }
  });

  ws.on("close", () => {
    if (ws !== hostSocket) {
      console.log(`Joueur ${ws.playerId} déconnecté`);
      if (hostSocket) {
        hostSocket.send(
          JSON.stringify({
            type: "player_left",
            player_id: ws.playerId,
          }),
        );
      }
    } else {
      hostSocket = null;
    }
  });
});

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
