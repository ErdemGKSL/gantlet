import type { App } from "./App";
import type { Handler } from "./HttpServer";

export class Middleware {
  constructor(private app: App, public path: string[], public handler: Handler) {}

  toJSON() {
    return {
      method: "MIDDLEWARE",
      path: this.path
        .filter(p => !(p.startsWith("(") && p.endsWith(")")))
        .map((p) => (p.startsWith("[") && p.endsWith("]")) ? `:${p.slice(1, -1)}` : p)
        .join("/") || "/"
    }
  }
}
