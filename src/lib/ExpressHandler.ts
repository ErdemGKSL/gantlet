import { App } from "./App";
import { Express } from "express";

export class ExpressHandler {
  public router: Express;
  constructor(private app: App) {}

  async init() {
    const express = await import("express").then(m => m?.default);
    this.router = express();
    return this;
  }

  emit(req: Request, res: Response) {
    this.router?.(req as any, res as any, () => void 0);
  }
}