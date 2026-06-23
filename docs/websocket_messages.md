# Messages WebSocket - SAE Épervier

Ce document répertorie de manière exhaustive tous les messages WebSocket échangés au sein du projet entre :
1. **L'Hôte (Client de Jeu Godot)**
2. **Le Serveur (Node.js)**
3. **Le Joueur (Contrôleur Web Mobile)**

---

## 📋 Table des Matières
1. [Flux de Connexion & Paramètres d'URL](#1-flux-de-connexion--parametres-durl)
2. [Échanges Joueur <---> Serveur](#2-echanges-joueur---serveur)
3. [Échanges Hôte (Godot) <---> Serveur](#3-echanges-hote-godot---serveur)
4. [Messages Relayés (Routage)](#4-messages-relayes-routage)

---

## 1. Flux de Connexion & Paramètres d'URL

Lors de l'établissement de la connexion WebSocket, le serveur identifie le type de client grâce aux paramètres de requête URL.

### Hôte (Godot)
* **URL** : `ws://<host>/?clientType=host` (ou par défaut sans `clientType`)
* **Fichiers concernés** :
  * [sockets.ts](file:///c:/Users/Baky/Documents/BUT/S3/Projet/sae-epervier/server/src/controllers/sockets.ts#L19-L33)
  * [server_socket.gd](file:///c:/Users/Baky/Documents/BUT/S3/Projet/sae-epervier/game-client/Network/server_socket.gd#L29-L34)

### Joueur (Contrôleur Web)
* **URL** : `ws://<host>/?clientType=player&hostCode=<hostCode>&name=<name>&playerId=<playerId>`
* **Paramètres** :
  * `clientType` : `"player"`
  * `hostCode` : Code du salon de jeu (ex: `ABCD`)
  * `name` : Pseudo saisi par le joueur
  * `playerId` *(optionnel)* : ID précédemment attribué (utilisé pour la reconnexion)
* **Fichiers concernés** :
  * [sockets.ts](file:///c:/Users/Baky/Documents/BUT/S3/Projet/sae-epervier/server/src/controllers/sockets.ts#L34-L113)
  * [player-socket.js](file:///c:/Users/Baky/Documents/BUT/S3/Projet/sae-epervier/server/client/js/player-socket.js#L3-L9)

---

## 2. Échanges Joueur <---> Serveur

### 📤 Envoyés par le Joueur au Serveur
Ces messages proviennent du contrôleur web du joueur pour interagir avec le serveur ou le jeu.

| Message (`type`) | Payload | Description | Action du Serveur |
| :--- | :--- | :--- | :--- |
| **`MOVE`** | `{ "type": "MOVE", "data": [x, y] }` | Coordonnées de déplacement du joystick. Le client multiplie les valeurs par 100 et les arrondit pour limiter la taille des données (ex: `[85, -50]`). | Relaye le message à l'hôte avec l'ID du joueur si les entrées ne sont pas bloquées. |
| **`USE_BONUS`** | `{ "type": "USE_BONUS", "data": { "bonus": "speed" \| "dash" } }` | Demande d'activation du bonus de vitesse (`speed`) ou de dash (`dash`). | Décrémente le bonus côté serveur (si disponible), relaye l'utilisation à l'hôte et renvoie `UPDATE_BONUS` au joueur. |
| **`REPLAY`** | `{ "type": "REPLAY" }` | Indique que le joueur souhaite rejouer après une relance de partie par l'hôte. | Ré-enregistre le joueur auprès de l'hôte et lui envoie les messages d'initialisation. |
| **`INSTANT_LEAVE`** | `{ "type": "INSTANT_LEAVE" }` | Quitte immédiatement la partie (ex: clic sur "Retour à l'accueil" après un redémarrage). | Ferme directement la socket du joueur sans attendre le délai de déconnexion habituel. |

### 📥 Reçus par le Joueur depuis le Serveur
Ces messages mettent à jour l'interface du contrôleur joueur.

| Message (`type`) | Payload | Description | Action du Joueur (Client) |
| :--- | :--- | :--- | :--- |
| **`SETUP_CONTROLLER`** | `{ "type": "SETUP_CONTROLLER", "data": { "id": number, "name": string } }` | Confirmation d'enregistrement du joueur avec son ID unique et son nom. | Initialise la manette sur l'interface et enregistre l'ID en `sessionStorage`. |
| **`RECONNECTION`** | `{ "type": "RECONNECTION", "data": { "id": number, "name": string, "bonus": { "speed": number, "dash": number }, "role": string } }` | Message de succès après reconnexion du joueur à une partie en cours. | Restaure l'ID, le rôle visuel et les compteurs de bonus sur la manette. |
| **`GET_BONUS`** | `{ "type": "GET_BONUS", "data": { "bonus": "speed" \| "dash" } }` | Notification qu'un bonus a été ramassé dans l'arène de jeu. | Incrémente le compteur graphique du bonus correspondant. |
| **`UPDATE_BONUS`** | `{ "type": "UPDATE_BONUS", "data": { "bonus": "speed" \| "dash", "count": number } }` | Synchronisation forcée du nombre de bonus restants. | Met à jour le compteur du bonus à la valeur exacte spécifiée. |
| **`SET_ROLE`** | `{ "type": "SET_ROLE", "data": { "role": "survivor" \| "infected" \| "sparrowhawk" \| "" } }` | Attribution d'un rôle par le jeu (début de manche ou infection). | Modifie le thème de l'interface (couleurs, libellés) en fonction du rôle. |
| **`PLAYER_KICK`** | `{ "type": "PLAYER_KICK" }` | Notification d'expulsion de la partie. | Affiche un écran d'expulsion avec un bouton de retour à l'accueil. |
| **`ERROR`** | `{ "type": "ERROR", "message": string, "error_type"?: "GAME_STARTED" }` | Message d'erreur (ex: code de salon incorrect ou partie déjà lancée). | Affiche l'erreur ou redirige vers une page d'erreur. |
| **`RESTART_GAME`** | `{ "type": "RESTART_GAME" }` | Avertit que l'hôte a réinitialisé la partie. | Remplace la manette par un écran demandant au joueur s'il veut rejouer. |

---

## 3. Échanges Hôte (Godot) <---> Serveur

### 📤 Envoyés par l'Hôte (Godot) au Serveur
Ces messages permettent à l'instance de jeu Godot de contrôler l'état global et d'envoyer des événements aux joueurs.

| Message (`type`) | Payload | Description | Action du Serveur |
| :--- | :--- | :--- | :--- |
| **`GAME_START`** | `{ "type": "GAME_START", "id": 0 }` | Démarre la partie depuis l'arène ou le salon. | Passe `gameStarted = true` et déconnecte les joueurs n'ayant pas rejoint à temps. |
| **`REQUEST_ROUND_START`** | `{ "type": "REQUEST_ROUND_START", "id": 0 }` | Demande le démarrage de la manche courante. | Bloque les entrées des joueurs, puis lance la séquence de décompte (`START_COUNTDOWN` -> `COUNTDOWN_TICK` -> `ROUND_START`). |
| **`REQUEST_ROUND_END`** | `{ "type": "REQUEST_ROUND_END", "id": 0 }` | Arrête la manche courante (ex: temps écoulé ou tous les survivants capturés). | Passe `inputsBlocked = true` pour ignorer les mouvements des joueurs. |
| **`RESTART_GAME`** | `{ "type": "RESTART_GAME", "id": 0 }` | Réinitialise la partie depuis l'écran de fin. | Réinitialise l'état du serveur, vide les rôles et envoie `RESTART_GAME` à tous les joueurs connectés. |
| **`GET_BONUS`** | `{ "type": "GET_BONUS", "id": playerId, "data": { "bonus": "speed" \| "dash" } }` | Donne un bonus à un joueur spécifique. | Incrémente le bonus sur le serveur et le notifie au joueur via `GET_BONUS`. |
| **`SET_ROLE`** | `{ "type": "SET_ROLE", "id": playerId, "data": { "role": "survivor" \| "infected" \| "sparrowhawk" } }` | Modifie le rôle d'un joueur ciblé. | Met à jour le rôle côté serveur et le notifie au joueur via `SET_ROLE`. |
| **`PLAYER_KICK`** | `{ "type": "PLAYER_KICK", "id": playerId }` *(voir note ci-dessous)* | Expulse un joueur de la partie. | Supprime le joueur du salon de l'hôte et ferme sa socket. |

### 📥 Reçus par l'Hôte (Godot) depuis le Serveur
Ces messages notifient l'hôte des actions des joueurs et des états de synchronisation.

| Message (`type`) | Payload | Description | Action de l'Hôte (Godot) |
| :--- | :--- | :--- | :--- |
| **`ROOM_CREATED`** | `{ "type": "ROOM_CREATED", "data": { "code": string } }` | Confirme la création du salon avec son code unique. | Affiche le code à l'écran et génère le QR code de connexion. |
| **`PLAYER_JOIN`** | `{ "type": "PLAYER_JOIN", "data": { "id": number, "name": string } }` | Un nouveau joueur a rejoint le salon. | Ajoute le joueur à la liste du lobby et instancie sa carte/personnage. |
| **`PLAYER_LEFT`** | `{ "type": "PLAYER_LEFT", "id": number }` | Un joueur a été déconnecté (expiration du timeout). | Supprime le joueur de la partie et met à jour les scores/compteurs. |
| **`MOVE`** | `{ "type": "MOVE", "id": number, "data": [x, y] }` | Transmet la position du joystick d'un joueur. | Met à jour le vecteur de déplacement du personnage associé dans le jeu. |
| **`USE_BONUS`** | `{ "type": "USE_BONUS", "id": number, "data": { "bonus": "speed" \| "dash" } }` | Transmet l'utilisation d'un bonus validé par le serveur. | Active l'effet physique du bonus sur le pion du joueur (Boost/Dash). |
| **`START_COUNTDOWN`** | `{ "type": "START_COUNTDOWN" }` | Indique le lancement du décompte de début de manche. | Affiche l'overlay de décompte initialisé à 3. |
| **`COUNTDOWN_TICK`** | `{ "type": "COUNTDOWN_TICK", "value": number }` | Indique une étape du décompte. | Met à jour le texte de l'overlay de décompte avec la valeur reçue (2, puis 1). |
| **`ROUND_START`** | `{ "type": "ROUND_START" }` | Fin du décompte, la manche commence. | Retire l'overlay de décompte, débloque les entrées et démarre le timer de la manche. |

---

## 4. Messages Relayés (Routage)

Le serveur Node.js agit comme un routeur intelligent :
* **Hôte vers Joueurs** :
  * Si l'hôte envoie un message destiné à `id = 0` (non traité spécifiquement par le serveur), ce message est **diffusé à tous les joueurs** connectés via la méthode `sendToAllPlayers()`.
  * Si le message cible un `id` spécifique, il est **transmis uniquement au joueur correspondant**.
* **Joueurs vers Hôte** :
  * Les messages génériques envoyés par les joueurs (comme `MOVE`) sont automatiquement enveloppés avec l'ID du joueur émetteur avant d'être transmis à l'hôte.
