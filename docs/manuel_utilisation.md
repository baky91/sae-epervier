# Manuel d'utilisation - L'épervier masqué 🎮

Ce guide rapide décrit les étapes nécessaires pour vérifier le bon fonctionnement de **L'épervier masqué**, que ce soit en local ou sur un serveur distant.

---

## 1. Accès au service

Selon votre environnement de test :
*   **En local :** Accédez à l'application via `http://localhost:3000`
*   **À distance :** Accédez à l'application via l'URL fournie par votre hébergement ou votre tunnel (ex. `https://sae-epervier.onrender.com`).

---

## 2. Scénario de test et de validation

Pour tester l'ensemble de la chaîne (Serveur Express + WebSockets + Client de jeu Godot Web + Manettes Web), suivez les étapes ci-dessous :

### Étape 1 : Héberger la partie (Écran central)
1. Ouvrez un navigateur sur votre écran principal (PC, TV, etc.).
2. Accédez à `http://localhost:3000/game` (ou cliquez sur **Héberger une partie** depuis la page d'accueil `/`).
3. Le client de jeu Godot se charge. Une fois prêt, un **code de partie à 4 lettres** (ex: `ABCD`) ainsi qu'un **QR Code** s'affichent à l'écran.

### Étape 2 : Connecter un joueur (Manette mobile)
1. Prenez un smartphone ou ouvrez un autre onglet/navigateur.
2. Accédez à `http://localhost:3000` et saisissez le code de la partie, ou accédez directement à `http://localhost:3000/ABCD` (remplacez `ABCD` par le code généré).
3. Saisissez votre pseudo et validez.
4. L'écran de votre téléphone se transforme en manette virtuelle contenant :
    *   Un joystick virtuel pour se déplacer.
    *   Un bouton pour activer les bonus (ex: Dash).
5. Vérifiez sur l'écran d'accueil du jeu que votre joueur apparaît bien dans la liste des joueurs connectés.

### Étape 3 : Simuler des participants (Test en nombre)
Pour tester le comportement de groupe et les performances du serveur sans connecter manuellement des dizaines de téléphones, utilisez le script de simulation de bots fourni :
1. Ouvrez un terminal dans le dossier `server`.
2. Lancez la commande suivante pour ajouter des bots (ex. 30 bots dans la partie `ABCD`) :
   ```bash
   # Pour un serveur local :
   npm run bots ABCD 30
   
   # Pour le serveur hébergé sur Render :
   npm run bots ABCD 30 <any-characters>
   ```
   *Note : Le paramètre `<any-characters>` (tout caractère) indique au script de se connecter à l'adresse WebSocket distante configurée dans le fichier `server/tests/tests-bots.js`.*
3. Observez l'écran hôte : les bots s'ajoutent à la liste des joueurs.

### Étape 4 : Lancer et jouer
1. Sur l'écran hôte, cliquez sur **Lancer la partie**.
2. L'arène de jeu démarre :
    *   Vérifiez que le joystick de votre manette déplace bien votre personnage.
    *   Vérifiez que les bots se déplacent de manière autonome sur l'écran.
    *   Vérifiez le système d'infection : lorsqu'un Épervier touche un Survivant, ce dernier doit devenir un Infecté (sa couleur change).
3. Laissez les manches se dérouler.
4. Vérifiez la transition d'écran :
    *   **Bilan de fin de manche** (statistiques intermédiaires présentant le nombre de survivants restants et les nouveaux infectés).

### Étape 5 : Vérifier le vainqueur et la fin de partie
1. À la fin de la dernière manche, l'écran de fin de partie s'affiche automatiquement sur l'écran central.
2. Vérifiez la proclamation du camp vainqueur :
    *   **Victoire des Éperviers :** S'affiche si tous les survivants ont été infectés au cours de la partie.
    *   **Victoire des Survivants :** S'affiche s'il reste au moins un survivant non infecté à la fin de la dernière manche.
3. Vérifiez l'affichage des statistiques globales et du classement final :
    *   Le **Top 10 des meilleurs infecteurs** (classement des joueurs ayant infecté le plus de survivants).

