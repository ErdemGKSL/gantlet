import { App } from "./App";
import { Express } from "express";
import * as fs from "fs/promises";

export class ExpressHandler {
  public router: Express;
  constructor(private app: App) {
    // ignore this, its just to make tsc aware of to import tslib, otherwise it doesnt and code doesnt run
    fs;
  }

  async init() {
    const express = await import("express").then(m => m?.default);
    this.router = express();
    return this;
  }

  emit(req: Request, res: Response) {
    this.router?.(req as any, res as any, () => void 0);
  }
}