import { randomIntFromInterval, toSquare } from "../dist/models/utils.js";

// Usage : node tests/tests-bots.js {hostCode} {numBots}

const SERVER_URL = "ws://localhost:3000";
const HOST_CODE = process.argv[2] || "ABCD";
const NUM_BOTS = parseInt(process.argv[3]) || 25;
const EMIT_INTERVAL = 40;

function createBot(id) {
  const socket = new WebSocket(
    `${SERVER_URL}/?clientType=player&hostCode=${HOST_CODE}&name=Bot_${id}`,
  );

  let moveX = 0;
  let moveY = 0;

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "SETUP_CONTROLLER") {
      console.log(`Nouveau bot ajouté: Bot_${id}`);

      setInterval(() => {
        moveX = randomIntFromInterval(-1, 1);
        moveY = randomIntFromInterval(-1, 1);
        const length = Math.sqrt(toSquare(moveX) + toSquare(moveY));

        moveX = (moveX / length) | moveX;
        moveY = (moveY / length) | moveY;

        socket.send(
          JSON.stringify({
            type: "MOVE",
            player_id: id,
            data: {
              x: moveX,
              y: moveY,
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
