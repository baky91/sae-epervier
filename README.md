# sae-epervier

## L'épervier masqué

Développé dans le cadre du projet SAE de la deuxième année du BUT Informatique à l'IUT d'Orsay, **L'épervier masqué** est un jeu en ligne massivement multijoueur (MMO) avec de nombreux participants. Ce projet offre une expérience de jeu asymétrique où chaque joueur utilise son smartphone comme manette (contrôleur web) pour intéragir en temps réel sur un écran partagé.

S'inspirant directement du jeu de cour d'école « L'épervier », l'idée est de combiner la nostalgie d'un jeu d'enfance avec les technologies web actuelles afin de proposer une expérience agréable, interactive et accessible à tous.

## Fonctionnalités principales

### 🎮 Gameplay & Expérience de Jeu

- Système de parties : L'hôte lance la partie sur un écran central (PC, TV, Projecteur...) et les joueurs rejoignent l'arène avec leur smartphone en scannant un QR Code ou en renseignant le code de la partie.
- Système de roles : Répartition automatique des rôles au début et pendant les manches (Survivants, Éperviers et Infectés).
- Système de bonus : Apparition et utilisation de compétences spéciales pour dynamiser la traque (Augmentation de vitesse, Dash)

### 🖥️ Interfaces et statistiques

- Ecran d'accueil : Affichage du lien et du QR Code pour participer à la partie, ainsi que la liste des joueurs en ligne.
Possibilité de modifier certains paramètres de la partie (Durée de manches, Nombre de manches...).
- Arène : Ecran principal de la traque, terrain composé de deux lignes démarquant les zones de sécurités pour les survivants.
- Bilan intermédiaire (Fin de manche) : Affichage d'un overlay en fin de manche présentant le nombre de survivants restants, les nouveaux infectés, et le classement des infections.
- Ecran de fin de partie : Proclamation du camp vainqueur (Survivants ou Éperviers), statistiques globales de la partie et affichage du Top 10 des meilleurs infecteurs de la partie.
- Manette : Contrôleur sur une page web composé d'un joystick virtuel pour le déplacement et de boutons pour l'utilisation des bonus collectés par le joueur.

## Architecture Technique
Le projet est divisé en trois entités distinctes communiquant en temps réel via WebSockets :

- **Game Client** (Godot 4) : Développé avec Godot Engine et GDScript, il gère la simulation physique, les collisions, l'affichage de l'arène et la logique globale du jeu.

- **Server** (Node.js) : Un serveur Express faisant office de relais de communication bidirectionnel. Il gère les salons (Rooms) et orchestre les flux de données entre les joueurs et l'hôte.

- **Contrôleur** (HTML/CSS/JS) : Une page web servant de contrôleur pour chaque joueur. Il gère les envois de données liées au joueur telles que les déplacements, l'utilisation des bonus.

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
npm run dev
```
Le serveur sera accessible sur http://localhost:3000

4. Exportation du jeu (facultatif)
Pour exporter le jeu en format Web:
- Ouvrir **game-client/** dans Godot
- Aller dans **Project > Export...**
- Utiliser le preset **Web** puis **Export Project**

*N'oubliez pas de relancer le serveur*

5. Accéder aux pages
- **Jeu** : /game
- **Contrôleur** : /{code}

## Guide de test

### Création de bots avec des mouvements aléatoires

Dans un autre terminal, lancer le script de lancement de bots:

**npm run bots <code_partie> <nb_bots>**

Exemple : lancer 50 bots dans la partie ayant le code "ABCD" → **npm run bots ABCD 50** 

## Structure du projet

```
sae-epervier
├─ create-docker-image   
│  └─ Dockerfile           # Image Docker pour Godot + NodeJS
├─ docs                    # Documentation technique (ex. protocole WebSocket)
├─ game-client             # Projet de jeu Godot (4.6)
│  ├─ Assets               
│  ├─ Globals              
│  ├─ Network              
│  ├─ Player               
│  ├─ Shaders              
│  ├─ UI                   
│  ├─ World                
│  └─ project.godot        
└─ server                  # Serveur de relais et hébergement Web (NodeJS / Express)
   ├─ client               # Fichiers statiques du contrôleur web (HTML, CSS, JS)
   ├─ game                 # Version exportée (Web) du client Godot
   ├─ public               # Assets publics du serveur (images...)
   ├─ src                  # Code source TypeScript du serveur Express
   │  ├─ controllers       
   │  ├─ models            
   │  ├─ routes            
   │  ├─ types             
   │  ├─ utils             
   │  └─ index.ts          # Point d'entrée de l'application
   └─ tests                # Scripts de simulation / tests (bots)
```

## Auteurs

Projet développé avec passion par :

- Ikbal ALI
- Bakary BOMOU
- Aboucabar KABA