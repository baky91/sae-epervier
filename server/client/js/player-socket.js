import { PlayerController } from "./player-controller.js";

const start = (hostCode, pseudo, playerId = null) => {
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
      const player_id = msg.data.id;
      // On enregistre l'id en cas de reconnexion
      sessionStorage.setItem("playerId", player_id);
      const player_name = msg.data.name;

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
                  data: [0, 0],
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
                // Optimisation: limiter le nombre de caractères envoyés: par exemple 13 (2) au lieu de 0.13 (4)
                data: [Math.round(x * 100), Math.round(y * 100)],
              }),
            );
            lastEmitTime = now;
            isMoving = true;
          }
        },
        onUseBonus: (type) => {
          const btn = document.getElementById(`${type}-btn`);
          if (!btn || btn.disabled) return;

          // On active le cooldown et on désactive le bouton via la mise à jour de l'affichage
          controller.bonusCooldowns[type] = true;
          controller.updateBonusDisplay();

          // Envoie au serveur
          socket.send(
            JSON.stringify({
              type: "USE_BONUS",
              data: { bonus: type },
            }),
          );

          // Réactivation après 5 secondes
          setTimeout(() => {
            controller.bonusCooldowns[type] = false;
            controller.updateBonusDisplay();
          }, 5000);
        },
      });

      // Si c'est une reconnexion, on reassigne le rôle et les bonus au joueur
      if (msg.type === "RECONNECTION") {
        controller.updateRole(msg.data.role);
        for (const [key, value] of Object.entries(msg.data.bonus)) {
          controller.setBonusCount(key, value);
        }
      }
    } else if (msg.type === "GET_BONUS") {
      if (controller) {
        const bonusName = msg.data.bonus;

        controller.addBonus(bonusName);
      }
    } else if (msg.type === "UPDATE_BONUS") {
      if (controller) {
        const { bonus, count } = msg.data;
        controller.setBonusCount(bonus, count);
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
        <a id="go-to-home" href="/">Retour à l'accueil</a>
      `;
    } else if (msg.type === "ERROR") {
      console.log("Erreur :", msg.message);
      if (msg.error_type === "GAME_STARTED") {
        window.location.href = `/error?reason=started&code=${hostCode}`;
      }
    } else if (msg.type === "RESTART_GAME") {
      const controlArea = document.querySelector(".control-area");
      if (controlArea) {
        controlArea.innerHTML = `
          <div class="replay-card">
            <h2 class="replay-title">L'hôte a relancé la partie</h2>
            <p class="replay-desc">Souhaitez-vous rejouer ?</p>
            <div class="replay-buttons">
              <button id="btn-replay" class="btn-action btn-replay">Rejouer</button>
              <button id="btn-home" class="btn-action btn-home">Retourner à l'accueil</button>
            </div>
          </div>
        `;

        document.getElementById("btn-replay").addEventListener("click", () => {
          socket.send(
            JSON.stringify({
              type: "REPLAY",
            })
          );

          controlArea.innerHTML = `
            <div class="replay-card">
              <div class="spinner"></div>
              <h2 class="replay-title">Demande envoyée</h2>
              <p class="replay-desc">En attente du lancement de la partie par l'hôte...</p>
            </div>
          `;
        });

        document.getElementById("btn-home").addEventListener("click", () => {
          socket.send(
            JSON.stringify({
              type: "INSTANT_LEAVE",
            })
          );

          sessionStorage.clear();
          window.location.href = "/";
        });
      }
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
  const inputPseudo = document.getElementById("player-pseudo");

  // Afficher la modal
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");

  formPseudo.addEventListener("submit", (e) => {
    e.preventDefault();
    pseudo = inputPseudo.value.trim();
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
  const playerId = sessionStorage.getItem("playerId");

  start(hostCode, pseudo, playerId);
}
