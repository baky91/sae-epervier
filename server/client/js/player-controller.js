export class PlayerController {
  constructor(containerId, options) {
    this.container = document.getElementById(containerId);
    this.playerNumber = options.playerNumber;
    this.playerName = options.playerName;
    this.role = null;
    this.bonus = {
      speed: 0,
      dash: 0,
    };
    this.bonusCooldowns = {
      speed: false,
      dash: false,
    };
    this.onMove = options.onMove;
    this.onUseBonus = options.onUseBonus;
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    this.render();

    document.getElementById("btn-quit").addEventListener("click", () => {
      sessionStorage.clear();
      window.location.href = "/";
    });

    const fullscreenBtn = document.getElementById("toggle-fullscreen");
    fullscreenBtn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        console.log("Mode Plein-Ecran activé");

        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen(); // Standard (Chrome, Edge moderne)
        } else if (document.documentElement.mozRequestFullScreen) {
          document.documentElement.mozRequestFullScreen(); // Firefox
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen(); // Safari et vieux Chrome
        } else if (document.documentElement.msRequestFullscreen) {
          document.documentElement.msRequestFullscreen(); // Internet Explorer
        }

        fullscreenBtn.innerHTML = getFullscreenIcon(true);
      } else if (document.exitFullscreen) {
        console.log("Mode Plein-Ecran désactivé");

        document.exitFullscreen();

        fullscreenBtn.innerHTML = getFullscreenIcon(false);
      }
    });

    this.initJoystick();
    this.setupKeyboard();

    // Empêche le zoom au double-tap
    document.addEventListener(
      "touchstart",
      function (event) {
        if (event.touches.length > 1) {
          event.preventDefault(); // Bloque le pinch-to-zoom (zoom à deux doigts)
        }
      },
      { passive: false },
    );

    let lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      function (event) {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault(); // Bloque le double-tap zoom
        }
        lastTouchEnd = now;
      },
      false,
    );
  }

  getRoleConfig() {
    const configs = {
      survivor: {
        color: "survivor",
        icon: "🏃",
        label: "Survivant",
        status: "En Jeu",
      },
      infected: {
        color: "infected",
        icon: "🧟",
        label: "Infecté",
        status: "Immobilisé",
      },
      sparrowhawk: {
        color: "sparrowhawk",
        icon: "🦅",
        label: "Épervier",
        status: "Chasseur",
      },
    };
    return configs[this.role];
  }

  render() {
    const config = this.getRoleConfig();

    this.container.innerHTML = `
            <!-- Header -->
            <div class="controller-header ${config ? config.color : ""}">
                <div class="player-info">
                    <div class="player-icon"><p>#${this.playerNumber}</p></div>
                    <div class="player-details">
                        <h2>${this.playerName}</h2>
                        <p>${config ? config.label : ""}</p>
                    </div>
                </div>

                <button id="toggle-fullscreen">
                  ${this.getFullscreenIcon(false)}
                </button>

                <button id="btn-quit">Quitter</button>

            </div>

            <!-- Control Area -->
            <div class="control-area">
                <div class="controls">
                    <!-- Joystick - Left -->
                    <div class="controls-left">
                        <div class="joystick-section">
                            <div id="joystick" class="joystick-container"></div>
                            <div class="joystick-label">
                                ${this.role === "infected" ? "Immobilisé" : ""}
                            </div>
                        </div>
                    </div>

                    <div class="controls-right">
                      ${Object.keys(this.bonus)
                        .map((type) => {
                          return `
                          <div class="bonus-section">
                            <button id="${type}-btn" class="bonus-button ${type}" ${this.bonus[type] === 0 || this.role === "infected" || this.bonusCooldowns[type] ? "disabled" : ""}>
                                ${this.getBonusIcon(type)}
                                <span>${ucfirst(type)}</span>
                            </button>
                            <div class="bonus-count ${this.bonus[type] > 0 ? type : "inactive"}">
                                ×${this.bonus[type]}
                            </div>
                          </div>
                        `;
                        })
                        .join("")}
                    </div>

                </div>

                ${
                  this.role === "infected"
                    ? `
                    <div class="status-message">
                        ${this.getShieldIcon()}
                        <span class="status-message-text">Vous êtes immobilisé jusqu'à la prochaine manche</span>
                    </div>
                `
                    : ""
                }
            </div>
        `;

    // Add event listeners for bonus buttons
    const speedBtn = document.getElementById(`speed-btn`);
    const dashBtn = document.getElementById(`dash-btn`);

    const handleBonus = (e, type) => {
      if (e.cancelable) e.preventDefault();
      this.onUseBonus(type);
    };

    speedBtn.addEventListener("touchstart", (e) => handleBonus(e, "speed"), {
      passive: false,
    });
    speedBtn.addEventListener("click", (e) => handleBonus(e, "speed"));

    dashBtn.addEventListener("touchstart", (e) => handleBonus(e, "dash"), {
      passive: false,
    });
    dashBtn.addEventListener("click", (e) => handleBonus(e, "dash"));

    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyX":
          handleBonus(e, "dash");
          break;
        case "KeyC":
          handleBonus(e, "speed");
          break;
      }
    });
  }

  updateRole(newRole) {
    this.role = newRole;
    this.render();
    this.initJoystick();
  }

  initJoystick() {
    const joystickContainer = document.getElementById(`joystick`);
    this.joystick = new VirtualJoystick(joystickContainer, 200, (x, y) => {
      if (this.role !== "infected") {
        this.onMove(x, y);
      }
    });

    if (this.role === "infected") {
      this.joystick.setInactive(true);
    }
  }

  /* GESTION DES MOUVEMENTS AU CLAVIER */

  setupKeyboard() {
    // Gestion de l'appui sur une touche
    document.addEventListener("keydown", (e) => {
      if (this.role === "infected") return;

      let changed = false;
      const keyCode = e.code;
      if (keyCode === "ArrowUp" || keyCode === "KeyW") {
        // Même en azerty, le touche Z aura le code "KeyW"
        this.keys.up = true;
        changed = true;
      } else if (keyCode === "ArrowDown" || keyCode === "KeyS") {
        this.keys.down = true;
        changed = true;
      } else if (keyCode === "ArrowLeft" || keyCode === "KeyA") {
        // Même en azerty, le touche Q aura le code "KeyA"
        this.keys.left = true;
        changed = true;
      } else if (keyCode === "ArrowRight" || keyCode === "KeyD") {
        this.keys.right = true;
        changed = true;
      }

      if (changed) {
        this.updateMovementFromKeyboard();
      }
    });

    // Gestion du relachement d'une touche
    document.addEventListener("keyup", (e) => {
      if (this.role === "infected") return;

      let changed = false;
      const keyCode = e.code;
      if (keyCode === "ArrowUp" || keyCode === "KeyW") {
        this.keys.up = false;
        changed = true;
      } else if (keyCode === "ArrowDown" || keyCode === "KeyS") {
        this.keys.down = false;
        changed = true;
      } else if (keyCode === "ArrowLeft" || keyCode === "KeyA") {
        this.keys.left = false;
        changed = true;
      } else if (keyCode === "ArrowRight" || keyCode === "KeyD") {
        this.keys.right = false;
        changed = true;
      }

      if (changed) {
        this.updateMovementFromKeyboard();
      }
    });
  }

  updateMovementFromKeyboard() {
    let x = 0;
    let y = 0;

    if (this.keys.up) y -= 1;
    if (this.keys.down) y += 1;
    if (this.keys.left) x -= 1;
    if (this.keys.right) x += 1;

    if (x !== 0 && y !== 0) {
      const length = Math.sqrt(x * x + y * y);
      y = y / length;
      x = x / length;
    }

    this.onMove(x, y);

    if (this.joystick) {
      this.joystick.updateStickFromKeyboard(x, y);
    }
  }

  /* GESTION DES BONUS */

  addBonus(type) {
    this.setBonusCount(type, this.bonus[type] + 1);
  }

  removeBonus(type) {
    this.setBonusCount(type, this.bonus[type] - 1);
  }

  setBonusCount(type, value) {
    this.bonus[type] = value;
    this.updateBonusDisplay();
  }

  updateBonusDisplay() {
    for (const [key, value] of Object.entries(this.bonus)) {
      const btn = document.getElementById(`${key}-btn`);
      const count = btn.nextElementSibling;

      // Update button
      // console.log("disabled ?", btn.disabled);
      btn.disabled =
        value === 0 || this.role === "infected" || this.bonusCooldowns[key];
      // console.log("disabled ?", btn.disabled);

      // Update count
      count.textContent = `×${value}`;

      // Update count style
      count.className = `bonus-count ${value > 0 ? key : "inactive"}`;
    }
  }

  getBonusIcon(type) {
    switch (type) {
      case "speed":
        return `<svg class="bonus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>`;
      case "dash":
        return `<svg class="bonus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="5 9 2 12 5 15"></polyline>
            <polyline points="9 5 12 2 15 5"></polyline>
            <polyline points="15 19 12 22 9 19"></polyline>
            <polyline points="19 9 22 12 19 15"></polyline>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="12" y1="2" x2="12" y2="22"></line>
        </svg>`;
      default:
        return type + "-bonus";
    }
  }

  // SVG Icons
  getZapIcon() {
    return `<svg class="bonus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>`;
  }

  getMoveIcon() {
    return `<svg class="bonus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="5 9 2 12 5 15"></polyline>
            <polyline points="9 5 12 2 15 5"></polyline>
            <polyline points="15 19 12 22 9 19"></polyline>
            <polyline points="19 9 22 12 19 15"></polyline>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="12" y1="2" x2="12" y2="22"></line>
        </svg>`;
  }

  getShieldIcon() {
    return `<svg class="status-message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="m9 12 2 2 4-4"></path>
        </svg>`;
  }

  getFullscreenIcon(enabled) {
    // Si le mode plein écran est activé,
    // on affiche l'image permettant de désactiver, et inversement
    if (enabled) {
      return `
          <img src="images/fullscreen-disable.svg">
          <span>Désactiver Plein-Ecran</span>
          `;
    } else {
      return `
          <img src="images/fullscreen-disable.svg">
          <span>Activer Plein-Ecran</span>
        `;
    }
  }
}

class VirtualJoystick {
  constructor(container, size, onMove) {
    this.container = container;
    this.size = size;
    this.onMove = onMove;
    this.isActive = false;
    this.stickPosition = { x: 0, y: 0 };
    this.maxDistance = size / 2 - 30;
    this.touchId = null;

    this.init();
  }

  init() {
    this.container.className = "virtual-joystick";
    this.container.style.width = `${this.size}px`;
    this.container.style.height = `${this.size}px`;

    const base = document.createElement("div");
    base.className = "joystick-base";

    const centerDot = document.createElement("div");
    centerDot.className = "joystick-center-dot";
    base.appendChild(centerDot);

    const stick = document.createElement("div");
    stick.className = "joystick-stick";
    const stickSize = 60;
    stick.style.width = `${stickSize}px`;
    stick.style.height = `${stickSize}px`;
    stick.style.top = `${(this.size - stickSize) / 2}px`;
    stick.style.left = `${(this.size - stickSize) / 2}px`;

    this.container.appendChild(base);
    this.container.appendChild(stick);

    this.stick = stick;
    this.stickSize = stickSize;

    // Écouteurs d'événements
    // On utilise bind(this) pour garder le contexte
    this.boundStart = this.handleStart.bind(this);
    this.boundMove = this.handleMove.bind(this);
    this.boundEnd = this.handleEnd.bind(this);

    this.container.addEventListener("mousedown", this.boundStart);
    this.container.addEventListener("touchstart", this.boundStart, {
      passive: false,
    });

    document.addEventListener("mousemove", this.boundMove);
    document.addEventListener("touchmove", this.boundMove, { passive: false });

    document.addEventListener("mouseup", this.boundEnd);
    document.addEventListener("touchend", this.boundEnd);
  }

  handleStart(e) {
    if (this.isActive) return; // Déjà actif
    e.preventDefault();

    this.isActive = true;

    // Gestion Tactile vs Souris
    if (e.changedTouches) {
      this.touchId = e.changedTouches[0].identifier;
    } else {
      this.touchId = null; // Souris
    }
  }

  handleMove(e) {
    if (!this.isActive) return;

    // Si c'est du tactile, on vérifie que c'est le bon doigt qui bouge
    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          e.preventDefault();
          this.updateStick(
            e.changedTouches[i].clientX,
            e.changedTouches[i].clientY,
          );
          break;
        }
      }
    } else {
      // Souris
      e.preventDefault();
      this.updateStick(e.clientX, e.clientY);
    }
  }

  handleEnd(e) {
    if (!this.isActive) return;

    // Si tactile, on vérifie si le doigt relevé est celui du joystick
    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          this.resetJoystick();
          break;
        }
      }
    } else {
      // Souris
      this.resetJoystick();
    }
  }

  resetJoystick() {
    this.isActive = false;
    this.touchId = null;

    // Reset visuel
    this.stick.style.transition = "0.1s"; // Petit effet retour ressort
    this.stick.style.top = `${(this.size - this.stickSize) / 2}px`;
    this.stick.style.left = `${(this.size - this.stickSize) / 2}px`;

    // On enlève la transition après pour le mouvement suivant
    setTimeout(() => {
      this.stick.style.transition = "none";
    }, 100);

    this.stickPosition = { x: 0, y: 0 };
    this.onMove(0, 0);
  }

  updateStick(x, y) {
    const rect = this.container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = x - centerX;
    let deltaY = y - centerY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this.maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * this.maxDistance;
      deltaY = Math.sin(angle) * this.maxDistance;
    }

    this.stick.style.left = `${(this.size - this.stickSize) / 2 + deltaX}px`;
    this.stick.style.top = `${(this.size - this.stickSize) / 2 + deltaY}px`;

    const normalizedX = deltaX / this.maxDistance;
    const normalizedY = deltaY / this.maxDistance;

    this.stickPosition = { x: normalizedX, y: normalizedY };
    this.onMove(normalizedX, normalizedY);
  }

  updateStickFromKeyboard(x, y) {
    if (this.isActive) return;

    this.stick.style.transition = "0.1s";
    this.stick.style.left = `${(this.size - this.stickSize) / 2 + x * this.maxDistance}px`;
    this.stick.style.top = `${(this.size - this.stickSize) / 2 + y * this.maxDistance}px`;

    setTimeout(() => {
      this.stick.style.transition = "none";
    }, 100);
  }

  setInactive(inactive) {
    if (inactive) {
      this.stick.classList.add("inactive");
    } else {
      this.stick.classList.remove("inactive");
    }
  }
}

function ucfirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
