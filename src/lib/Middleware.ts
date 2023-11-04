import type { App } from "./App";
import type { Handler } from "./HttpServer";

export class Middleware {
  

  constructor(private app: App, public path: string[], public handler: Handler) {}

}
