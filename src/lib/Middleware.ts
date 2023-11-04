import type { App } from "./App";
import type { Handler } from "./HttpServer";

export class Middleware {
  

  constructor(private app: App, private path: string[], public handler: Handler) {}

}
