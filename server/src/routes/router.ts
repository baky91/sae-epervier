import express, { Request, Response } from "express";
import ClientHost from "../models/ClientHost.js";
import { join } from "node:path";

export function createRouter(hosts: Map<string, ClientHost>) {
  const router = express.Router();

  router.get("/", (req: Request, res: Response) => {
    res.sendFile(join(import.meta.dirname, "../../public/index.html"));
  });

  router.get("/game", (req: Request, res: Response) => {
    res.sendFile(join(import.meta.dirname, "../../game/index.html"));
  });

  router.get("/:hostCode", (req: Request, res: Response) => {
    const { hostCode } = req.params;

    if (!Array.isArray(hostCode) && hosts.has(hostCode)) {
      res.sendFile(join(import.meta.dirname, "../../public/controller.html"));
    } else {
      res.sendFile(join(import.meta.dirname, "../../public/error-page.html"));
    }
  });

  return router;
}
