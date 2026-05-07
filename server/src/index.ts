import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import { join } from "node:path";
import { WebSocketServer } from "ws";
import ClientHost from "./models/ClientHost";
import { createRouter } from "./routes/router";
import { setupWebSockets } from "./controllers/sockets";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server }); // On lie ws au serveur http

const isDev = process.env.NODE_ENV === "development";

const PORT = process.env.PORT || 3000;
const hosts = new Map<string, ClientHost>();

// SECURITE
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// FICHIERS STATIQUES
if (isDev){
  app.use(express.static(join(__dirname, "../client")));
  app.use(express.static(join(__dirname, "../public")));
} else {
  app.use(express.static(join(__dirname, "public")));
}
app.use(express.static(join(__dirname, "../game")));

// ROUTES
app.use("/", createRouter(hosts));

// COMMUNICATIONS SOCKETS
setupWebSockets(wss, hosts);

// LANCEMENT DU SERVEUR
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
