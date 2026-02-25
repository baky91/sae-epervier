const start = (hostCode, pseudo, playerId = null) => {
  console.log("Host code:", hostCode, "; Pseudo:", pseudo);

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  let socketUrl = `${protocol}://${window.location.host}/?clientType=player&hostCode=${hostCode}&name=${pseudo}`;
  if (playerId) {
    socketUrl += `&playerId=${playerId}`;
  }
  const socket = new WebSocket(socketUrl);

  let controller = null;

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "newplayer" || msg.type === "reconnection") {
      const player_id = msg.data.player_id;
      // On enregistre l'id en cas de reconnexion
      localStorage.setItem("playerId", player_id);
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
};

const hostCode = window.location.pathname.split("/")[1];

let pseudo = sessionStorage.getItem("pseudo");

// Lors de la première connexion, il n'y aura pas de pseudo enregistré
if (!pseudo) {
  console.log("Aucun pseudo enregistré");

  const modal = document.querySelector(".modal");
  const overlay = document.querySelector(".overlay");
  const formPseudo = document.getElementById("form-pseudo");
  const inputPseudo = document.getElementById("pseudo");

  // Afficher la modal
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");

  formPseudo.addEventListener("submit", (e) => {
    e.preventDefault();
    pseudo = inputPseudo.value;
    // On enregistre le pseudo en cas de reconnexion
    sessionStorage.setItem("pseudo", pseudo);

    // Fermer la modal
    modal.classList.add("hidden");
    overlay.classList.add("hidden");

    start(hostCode, pseudo);
  });
} else {
  // Si il y'a un pseudo on lance directement
  console.log("Un pseudo est enregistré:", pseudo);

  // Si un pseudo est enregistré, alors un id est aussi enregistré
  const playerId = localStorage.getItem("playerId");
  console.log("ID:", playerId);

  start(hostCode, pseudo, playerId);
}
