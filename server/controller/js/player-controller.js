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

class PlayerController {
  constructor(containerId, options) {
    this.container = document.getElementById(containerId);
    this.playerNumber = options.playerNumber;
    this.playerName = options.playerName;
    this.role = null;
    this.speedBonus = 0;
    this.dashBonus = 0;
    this.onMove = options.onMove;
    this.onUseSpeedBonus = options.onUseSpeedBonus;
    this.onUseDashBonus = options.onUseDashBonus;
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    this.render();
    this.initJoystick();
    this.setupKeyboard();
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
                    <div class="player-icon">${config ? config.icon : ""}</div>
                    <div class="player-details">
                        <h2>${this.playerName}</h2>
                        <p>Joueur #${this.playerNumber}</p>
                    </div>
                </div>
                <div class="status-badge ${config ? config.color : ""}">
                    ${config ? config.label : ""}
                </div>
            </div>

            <!-- Control Area -->
            <div class="control-area">
                <div class="controls">
                    <!-- Joystick - Left -->
                    <div class="controls-left">
                        <div class="joystick-section">
                            <div id="joystick" class="joystick-container"></div>
                            <div class="joystick-label">
                                ${this.role === "infected" ? "Immobilisé" : "Déplacements"}
                            </div>
                        </div>
                    </div>

                    <div class="controls-right">
                        <!-- Bonus Speed - Center -->
                        <div class="bonus-section">
                            <button id="speed-btn" class="bonus-button speed" ${this.speedBonus === 0 || this.role === "infected" ? "disabled" : ""}>
                                ${this.getZapIcon()}
                                <span>Vitesse</span>
                            </button>
                            <div class="bonus-count ${this.speedBonus > 0 ? "speed" : "inactive"}">
                                ×${this.speedBonus}
                            </div>
                        </div>

                        <!-- Bonus Dash - Right -->
                        <div class="bonus-section">
                            <button id="dash-btn" class="bonus-button dash" ${this.dashBonus === 0 || this.role === "infected" ? "disabled" : ""}>
                                ${this.getMoveIcon()}
                                <span>Dash</span>
                            </button>
                            <div class="bonus-count ${this.dashBonus > 0 ? "dash" : "inactive"}">
                                ×${this.dashBonus}
                            </div>
                        </div>
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

    const handleSpeed = (e) => {
      // Empêche le clic fantôme si on utilise touchstart
      if (e.cancelable) e.preventDefault();
      if (this.speedBonus > 0 && this.role !== "infected") {
        this.onUseSpeedBonus();
      }
    };

    const handleDash = (e) => {
      if (e.cancelable) e.preventDefault();
      if (this.dashBonus > 0 && this.role !== "infected") {
        this.onUseDashBonus();
      }
    };

    // On écoute le tactile (instantané) ET le clic (souris/fallback)
    speedBtn.addEventListener("touchstart", handleSpeed, { passive: false });
    speedBtn.addEventListener("click", handleSpeed);

    dashBtn.addEventListener("touchstart", handleDash, { passive: false });
    dashBtn.addEventListener("click", handleDash);

    document.addEventListener("keydown", (e) => {
      if (e.code === "KeyX") handleDash(e);
      else if (e.code === "KeyC") handleSpeed(e);
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

  addBonus(bonus_name) {
    if (bonus_name === "speed") {
      this.setSpeedBonus(this.speedBonus + 1);
    } else if (bonus_name === "dash") {
      this.setDashBonus(this.dashBonus + 1);
    }
  }

  setSpeedBonus(value) {
    this.speedBonus = value;
    this.updateBonusDisplay();
  }

  setDashBonus(value) {
    this.dashBonus = value;
    this.updateBonusDisplay();
  }

  updateBonusDisplay() {
    const speedBtn = document.getElementById(`speed-btn`);
    const dashBtn = document.getElementById(`dash-btn`);
    const speedCount = speedBtn.nextElementSibling;
    const dashCount = dashBtn.nextElementSibling;

    // Update buttons
    speedBtn.disabled = this.speedBonus === 0 || this.role === "infected";
    dashBtn.disabled = this.dashBonus === 0 || this.role === "infected";

    // Update counts
    speedCount.textContent = `×${this.speedBonus}`;
    dashCount.textContent = `×${this.dashBonus}`;

    // Update count styles
    speedCount.className = `bonus-count ${this.speedBonus > 0 ? "speed" : "inactive"}`;
    dashCount.className = `bonus-count ${this.dashBonus > 0 ? "dash" : "inactive"}`;
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
}
