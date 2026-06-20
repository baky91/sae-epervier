# Fichier Dockerfile pour le déploiement sur Render
FROM baky91/godot-node

WORKDIR /app

COPY . .

# Serveur
WORKDIR /app/server

# Installation des dépendances
RUN npm ci

# Build TypeScript + Vite
RUN npm run build

# Build Godot
RUN mkdir -p public/game \
    && godot --headless ../game-client/project.godot --export-release Web

# Exécution
CMD ["npm", "start"]