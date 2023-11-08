import type { App } from "./App";
import type { Handler } from "./HttpServer";

export class Route {
  constructor(private app: App, public path: string[], public method: RouteMethods, public handler: Handler) {}

  toJSON() {
    return {
      method: this.method,
      path: this.path
        .filter(p => !(p.startsWith("(") && p.endsWith(")")))
        .map((p) => (p.startsWith("[") && p.endsWith("]")) ? `:${p.slice(1, -1)}` : p)
        .join("/")
    }
  }
}

export type RouteMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "CONNECT" | "TRACE" | "ALL";