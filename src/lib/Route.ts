import type { App } from "./App";

export class Route {
  

  constructor(private app: App, private path: string, public method: RouteMethods, public handler: RouteHandler) {

  }

}

export type RouteMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "CONNECT" | "TRACE"

export type RouteHandler = (req: any, res: any) => void;