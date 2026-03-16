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

    if (msg.type === "SETUP_CONTROLLER" || msg.type === "RECONNECTION") {
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
        onMove: (x, y) => {
          const now = Date.now();
          if (x === 0 && y === 0) {
            if (isMoving) {
              socket.send(
                JSON.stringify({
                  type: "MOVE",
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
                type: "MOVE",
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
              type: "USE_BONUS",
              data: { bonus: "speed" },
            }),
          );
        },
        onUseDashBonus: () => {
          controller.setDashBonus(controller.dashBonus - 1);
          socket.send(
            JSON.stringify({
              type: "USE_BONUS",
              data: { bonus: "dash" },
            }),
          );
        },
      });

      // Si c'est une reconnexion, on reassigne le rôle et les bonus au joueur
      if (msg.type === "RECONNECTION") {
        controller.updateRole(msg.data.player_role);
        controller.setSpeedBonus(msg.data.player_bonus.speed);
        controller.setDashBonus(msg.data.player_bonus.dash);
      }
    } else if (msg.type === "GET_BONUS") {
      if (controller) {
        const bonusName = msg.data.bonus;

        controller.addBonus(bonusName);
      }
    } else if (msg.type === "SET_ROLE") {
      if (controller) {
        const newRole = msg.data.role;

        controller.updateRole(newRole);
      }
    } else if (msg.type === "PLAYER_KICK") {
      console.log("Vous avez été expulsé de la partie.");
      controller.container.innerHTML = `
        <h1>Vous avez été expulsé</h1>
        <a href="/">Retour à l'accueil</a>
      `;
    } else if (msg.type === "ERROR") {
      console.log("Erreur :", msg.message);
    }
  };

  socket.onclose = (event) => {
    console.log(event);
  };
};

const hostCode = window.location.pathname.split("/")[1];

let pseudo = sessionStorage.getItem("pseudo");
const savedHostCode = sessionStorage.getItem("hostCode");

// Lors de la première connexion, il n'y aura pas de pseudo enregistré
if (!pseudo) {
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
    sessionStorage.setItem("hostCode", hostCode);

    // Fermer la modal
    modal.classList.add("hidden");
    overlay.classList.add("hidden");

    start(hostCode, pseudo);
  });
} else if (pseudo && savedHostCode !== hostCode) {
  // si un pseudo est enregistré mais que le code de la partie est différente, on relance mais en prenant en compte le pseudo
  start(hostCode, pseudo);
} else {
  // Si il y'a un pseudo et que c'est la même partie on lance directement

  // Si un pseudo est enregistré, alors un id est aussi enregistré
  const playerId = localStorage.getItem("playerId");

  start(hostCode, pseudo, playerId);
}
