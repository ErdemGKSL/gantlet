import type { App } from "./App";

export class MiddleWare {
  

  constructor(private app: App, private path: string[], public handler: MiddleWareHandler) {}

}

export type MiddleWareHandler = (req: any, res: any) => void;