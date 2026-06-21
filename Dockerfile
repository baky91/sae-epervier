FROM bakyydev/godot-node AS builder

WORKDIR /app

COPY . .

# Serveur
WORKDIR /app/server

# Installation des dépendances
RUN npm ci

# Build TypeScript + Vite
RUN npm run build

# Exportation Web du jeu Godot

RUN mkdir -p game \
    && godot --headless ../game-client/project.godot --export-release Web

# Démarrage du serveur
FROM node:22-slim

WORKDIR /app/server

# Copie des fichiers compilés à l'étape précédente
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/game ./game
COPY --from=builder /app/server/package*.json ./

# Installation des dépendances de production uniquement
RUN npm ci --omit=dev

EXPOSE 3000

CMD ["npm", "start"]