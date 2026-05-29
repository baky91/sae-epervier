import express, { Request, Response } from "express";
import ClientHost from "../models/ClientHost";
import { join } from "path";

export function createRouter(hosts: Map<string, ClientHost>) {
  const router = express.Router();
  const isDev = process.env.NODE_ENV === "development";

  const staticPath = isDev
    ? join(__dirname, "../../client")
    : join(__dirname, "../public");

  router.get("/", (req: Request, res: Response) => {
    res.sendFile(join(staticPath, "index.html"));
  });

  router.get("/game", (req: Request, res: Response) => {
    res.sendFile(join(__dirname, "../../game/index.html"));
  });

  router.get("/:hostCode", (req: Request, res: Response) => {
    const hostCode = req.params.hostCode as string;
    const host = hosts.get(hostCode);

    // Si l'hôte existe ET que la partie n'a pas commencé
    if (host && !host.gameStarted) {
      return res.sendFile(join(staticPath, "controller.html"));
    }

    // Dans tous les autres cas (erreur, pas d'hôte, partie déjà lancée)
    return res.sendFile(join(staticPath, "error-page.html"));
  });

  return router;
}
