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
    return res.sendFile(join(staticPath, "index.html"));
  });

  router.get("/game", (req: Request, res: Response) => {
    return res.sendFile(join(__dirname, "../../game/index.html"));
  });

  router.get("/error", (req: Request, res: Response) => {
    return res.sendFile(join(staticPath, "error-page.html"));
  });

  router.get("/:hostCode", (req: Request, res: Response) => {
    const hostCode = req.params.hostCode as string;
    const host = hosts.get(hostCode);

    // Erreur 1 : La partie n'a pas été trouvée
    if (!host) {
      return res.redirect("/error?reason=not_found&code=" + hostCode);
    }

    // Erreur 2 : La partie est déjà lancée
    if (host.gameStarted) {
      return res.redirect("/error?reason=started&code=" + hostCode);
    }

    // Succès : La partie existe et elle est disponible
    return res.sendFile(join(staticPath, "controller.html"));
  });

  return router;
}
