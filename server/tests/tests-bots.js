const { randomIntFromInterval, toSquare } = require("../models/utils");

const SERVER_URL = "ws://localhost:3000";
const HOST_CODE = "ABCD";
const NUM_BOTS = 25;
const EMIT_INTERVAL = 40;

function createBot(id) {
  const socket = new WebSocket(
    `${SERVER_URL}/?clientType=player&hostCode=${HOST_CODE}&name=Bot_${id}`,
  );

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "newplayer") {
      console.log(`Nouveau bot ajouté: Bot_${id}`);

      setInterval(() => {
        let x = randomIntFromInterval(-1, 1);
        let y = randomIntFromInterval(-1, 1);
        const length = Math.sqrt(toSquare(x) + toSquare(y));

        x = (x / length) | x;
        y = (y / length) | x;

        socket.send(
          JSON.stringify({
            type: "move",
            player_id: id,
            data: {
              x: x,
              y: y,
            },
          }),
        );
      }, EMIT_INTERVAL); // Mouvements aléatoire
    }
  };

  socket.onclose = (event) => {
    console.log(`Joueur Bot_${id} déconnecté.`);
  };
}

for (let i = 1; i <= NUM_BOTS; i++) {
  setTimeout(() => createBot(i), i * 50); // Générer les bots avec 50ms d'interval
}
