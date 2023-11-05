import { App } from "./App";
import express from "express";

export class ExpressHandler {
  
  public router = express();
  constructor(private app: App) {
    this.router.listen = () => void 0;
  }

  emit(req: Request, res: Response) {
    this.router(req as any, res as any, () => void 0);
  }

}