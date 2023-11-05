import type { App } from "./App";
import type { Handler } from "./HttpServer";

export class Route {
  

  constructor(private app: App, public path: string[], public method: RouteMethods, public handler: Handler) {}

}

export type RouteMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "CONNECT" | "TRACE" | "ALL";