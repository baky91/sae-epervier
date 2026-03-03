# sae-epervier

L’épervier masqué est un projet universitaire dans le cadre de notre deuxième année de BUT Informatique en apprentissage. Le but est de créer un jeu en ligne massivement multijoueur. Les joueurs utilisent leurs appareils en guise de contrôleur, et jouent sur un écran central partagé.

On a choisi de créer L’épervier masqué, inspiré de notre enfance, du fameux jeu l’épervier, jeu auquel tout le monde a déjà joué pendant son enfance dans la cour de récréation à l’école primaire. Notre but est de vous refaire plonger dans la nostalgie de l’enfance, en passant du bon temps avec ses proches.


## Architecture Technique
Le projet est divisé en trois entités distinctes communiquant en temps réel via WebSockets :

- **Game Client** (Godot 4) : Développé avec Godot Engine et GDScript, il gère la simulation physique, les collisions, l'affichage de l'arène et la logique globale du jeu.

- **Server** (Node.js) : Un serveur Express faisant office de relais de communication bidirectionnel. Il gère les salons (Rooms) et orchestre les flux de données entre les joueurs et l'hôte.

- **Contrôleur** (HTML/CSS/JS) : Une page web servant de contrôleur pour chaque joueur. Il gère les envois de données liées au joueur telles que les déplacements, l'utilisation des bonus.

## Structure du projet

```
sae-epervier
├─ game-client          # Projet Godot
│  ├─ Assets
│  ├─ Network
│  ├─ Player
│  ├─ Shaders
│  ├─ UI
│  ├─ World
│  └─ project.godot     
└─ server               # Serveur NodeJS & Front-End
   ├─ game              # Jeu Godot exporté en HTML
   ├─ models            
   ├─ public            # Page d'accueil + Contrôleur web
   ├─ tests             
   └─ index.js          # Point d'entrée du serveur
```

## Installation et Lancement

1. Prérequis
- Node.js
- Godot Engine 4 (facultatif)

2. Installation du serveur
```bash
cd server
npm install
```

3. Lancement du serveur
```bash
npm start
```
Le serveur sera accessible sur http://localhost:3000

4. Exportation du jeu (facultatif)
Pour exporter le jeu en format Web:
- Ouvrir **game-client/** dans Godot
- Aller dans **Project > Export...**
- Utiliser le preset **Web** puis **Export Project**

*N'oubliez pas de relancer le serveur*

5. Lancer les bots

S'assurer que le serveur et qu'une partie sont lancées.\
Lancer le script de test: **node tests/tests-bots.js {code} {nbBots}**

Par exemple, pour lancer 20 bots dans la partie ABCD:
- **node tests/tests-bots.js ABCD 20**


6. Accéder aux pages
- **Jeu** : /game
- **Contrôleur** : /{code}

## Fonctionnalités

- **Système de partie** : Génération de codes uniques pour l'hôte (Godot) afin de séparer les sessions de jeu.
