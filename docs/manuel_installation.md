# Manuel d'installation & Déploiement - L'épervier masqué

Ce document décrit les prérequis matériels et logiciels ainsi que les étapes d'installation et de configuration pour reproduire et déployer l'infrastructure complète de **L'épervier masqué**.

---

## 1. Architecture Matérielle

L'infrastructure matérielle requise pour faire tourner le système est organisée comme suit :

1.  **Écran Principal (Affichage de l'Arène) :**
    *   Un ordinateur, une TV connectée ou un vidéoprojecteur doté d'un navigateur web récent (supportant **WebGL 2**).
2.  **Manettes de Jeu (Clients Joueurs) :**
    *   Des smartphones ou tablettes (iOS ou Android) disposant d'un navigateur web mobile et d'une connexion réseau (Wi-Fi ou 4G/5G).
3.  **Serveur de Relais :**
    *   Une machine physique (ordinateur local, serveur de développement) ou une plateforme d'hébergement cloud (ex: Render).
4.  **Réseau et Connectivité :**
    *   **En local :** Le serveur et les smartphones doivent être connectés au **même réseau local (Wi-Fi)** pour communiquer (à moins d'utiliser un outil de tunneling comme ngrok).
    *   **En production :** Le serveur doit posséder une adresse IP publique ou un nom de domaine accessible via Internet (HTTPS/WSS requis pour les accès mobiles sécurisés).

---

## 2. Prérequis Logiciels

Pour installer et compiler le projet en local, les logiciels suivants sont requis :

*   **Node.js :** Version 22.x ou supérieure.
*   **Godot Engine :** Version 4.6 (Stable) - Requis pour exporter manuellement.
*   **Docker :** Requis pour le déploiement conteneurisé (local ou sur Render).

---

## 3. Installation et Lancement Local (Développement)

### Étape 1 : Cloner le dépôt et installer le serveur Node.js
1. Clonez ou téléchargez le code source du projet.
2. Ouvrez un terminal dans le dossier `server/` du projet :
   ```bash
   cd server
   npm install
   ```

### Étape 2 : Exporter le client Godot (Web)
Le serveur Express sert le client de jeu Godot statiquement depuis le dossier `server/game/`.
1. Ouvrez le dossier `game-client/` dans **Godot Engine 4.6**.
2. Allez dans **Projet > Exporter...**
3. Si ce n'est pas fait, ajoutez un preset **Web**.
4. Définissez le chemin d'exportation vers `server/game/index.html`.
5. Cliquez sur **Exporter le projet** (veillez à décocher "Exporter avec le débogage" pour la production).
*Alternative en ligne de commande (si Godot est configuré globalement) :*
```bash
# À exécuter depuis le dossier server/
./<executable_godot> --headless ../game-client/project.godot --export-release Web

# Si Godot est dans le PATH
godot --headless ../game-client/project.godot --export-release Web
```

### Étape 3 : Lancer le serveur
Pour démarrer le serveur en mode développement (avec rechargement automatique via Nodemon et compilation TypeScript lors de la sauvegarde du fichier src/index.ts) :
```bash
npm run dev
```
Le serveur sera disponible à l'adresse : `http://localhost:3000`.

---

## 4. Lancement avec Docker (Production)

L'utilisation de Docker simplifie le déploiement en automatisant l'installation de Godot, l'exportation web du jeu, la compilation TypeScript, et le lancement du serveur Node dans un conteneur isolé. 

### Étape 1 : Récupérer l'image Docker de base (Godot + Node)
Le dossier `create-docker-image/` contient un Dockerfile permettant de créer une image contenant Node.js 22, Godot 4.6 et ses templates d'exportation Web pour Linux.

Cette image est actuellement héberger sur le Docker Hub sous `bakyydev/godot-node`.

Vous pouvez télécharger l'image préconstruite :
```bash
docker pull bakyydev/godot-node
```

### Étape 2 : Construire l'image du projet
Exécutez la commande suivante à la racine du projet :
```bash
docker build -t sae-epervier .
```

### Étape 3 : Lancer le conteneur localement
Démarrez le conteneur en associant le port 3000 :
```bash
docker run --name epervier-app sae-epervier
```
L'application est maintenant accessible localement sur `http://localhost:3000`.

---

## 5. Hébergement sur Render avec Docker

[Render](https://render.com) permet d'héberger des services Web on utilisant notamment Docker simplement et gratuitement.

### Étape 1 : Préparer le dépôt
Assurez-vous que votre projet est versionné sur un dépôt Git public ou privé (GitHub).

### Étape 2 : Créer un nouveau Web Service
1. Connectez-vous sur votre compte **Render**.
2. Cliquez sur le bouton **New +** en haut à droite, puis sélectionnez **Web Service**.
3. Associez votre compte Git et sélectionnez le dépôt de votre projet `sae-epervier`.

### Étape 3 : Configurer les paramètres du service
Remplissez les informations de configuration suivantes :
*   **Name :** `sae-epervier` (ou le nom de votre choix)
*   **Region :** Choisissez la région la plus proche de vos utilisateurs (ex: `Frankfurt (EU)`)
*   **Branch :** `main`
*   **Runtime :** Sélectionnez **Docker**. Render détectera automatiquement le **Dockerfile** situé à la racine.
*   **Plan :** Sélectionnez un plan (le plan **Free** est suffisant pour ce projet).

### Étape 4 : Lancement et URLs
1. Cliquez sur **Deploy Web Service**. Render va alors récupérer l'image de base `bakyydev/godot-node`, exécuter les étapes de build (compilation et export Godot) et démarrer le conteneur.
2. Une fois le statut à **Live**, Render vous fournit une adresse HTTPS unique (ex: `https://sae-epervier.onrender.com`).
    *   **Accès Jeu (Écran central) :** `https://sae-epervier.onrender.com/game`
    *   **Accès Contrôleur (Smartphones) :** `https://sae-epervier.onrender.com/{code}`
    *   Les connexions WebSockets basculent automatiquement sur le protocole sécurisé `wss://`.

---

## 6. Création d'une passerelle ngrok

### Tunneling pour les tests mobiles locaux (ngrok)
Si vous développez en local et voulez connecter des smartphones sans déployer sur Render :
1. Installez ngrok et lancez un tunnel sur le port 3000 :
   ```bash
   ngrok http 3000
   ```
2. Utilisez l'adresse HTTPS publique fournie par ngrok pour connecter vos smartphones.
