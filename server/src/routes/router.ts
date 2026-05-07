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
    const { hostCode } = req.params;

    if (!Array.isArray(hostCode) && hosts.has(hostCode)) {
      res.sendFile(join(staticPath, "controller.html"));
    } else {
      res.sendFile(join(staticPath, "error-page.html"));
    }
  });

  return router;
}
