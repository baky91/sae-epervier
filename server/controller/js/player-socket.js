const hostCode = window.location.pathname.split("/")[1];

const urlParams = new URLSearchParams(window.location.search);
const pseudo = urlParams.get("pseudo") || "Anonyme";

console.log("Host code:", hostCode, "; Pseudo:", pseudo);

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(
  `${protocol}://${window.location.host}/?clientType=player&hostCode=${hostCode}&name=${pseudo}`,
);

let controller = null;

socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "newplayer") {
    const player_id = msg.data.player_id;
    const player_name = msg.data.player_name;

    let lastEmitTime = 0;
    const EMIT_INTERVAL = 40;
    let isMoving = false;

    controller = new PlayerController("controller", {
      playerNumber: player_id,
      playerName: player_name,
      // role: player_role,
      onMove: (x, y) => {
        const now = Date.now();
        if (x === 0 && y === 0) {
          if (isMoving) {
            socket.send(
              JSON.stringify({
                type: "move",
                data: { x: 0, y: 0 },
              }),
            );
            isMoving = false;
          }
          return;
        }

        if (now - lastEmitTime >= EMIT_INTERVAL) {
          socket.send(
            JSON.stringify({
              type: "move",
              data: { x: x, y: y },
            }),
          );
          lastEmitTime = now;
          isMoving = true;
        }
      },
      onUseSpeedBonus: () => {
        controller.setSpeedBonus(controller.speedBonus - 1);
        socket.send(
          JSON.stringify({
            type: "use_bonus",
            data: { bonus: "speed" },
          }),
        );
      },
      onUseDashBonus: () => {
        controller.setDashBonus(controller.dashBonus - 1);
        socket.send(
          JSON.stringify({
            type: "use_bonus",
            data: { bonus: "dash" },
          }),
        );
      },
    });
  } else if (msg.type === "bonus_obtained") {
    if (controller) {
      const bonusName = msg.data.bonus;

      controller.addBonus(bonusName);
    }
  } else if (msg.type === "new_role") {
    if (controller) {
      const newRole = msg.data.role;

      controller.updateRole(newRole);
    }
  } else if (msg.type === "error") {
    console.log("Erreur :", msg.message);
  }
};
