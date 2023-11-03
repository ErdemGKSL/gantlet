import { PathLike } from "fs";
import path from "path";
import { getFileFromCallStack } from "./getFileFromCallStack";
import { Route, RouteHandler, RouteMethods } from "./Route";

export class App {

  path: string;
  private routes: Route[] = [];
  constructor(routesPath?: PathLike) {
    this.path = routesPath ? path.resolve(process.cwd(), routesPath.toString()) : path.resolve(getFileFromCallStack(), "./routes")
  }

  private addRoute(routePath: string, method: RouteMethods, handler: RouteHandler) {
    const route = new Route(this, routePath, method, handler);
    this.routes.push(route);
  }

  get(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFileFromCallStack()),
      "GET",
      handler
    );
  }

  post(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFileFromCallStack()),
      "POST",
      handler
    );
  }

  put(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFileFromCallStack()),
      "PUT",
      handler
    );
  }

  delete(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFileFromCallStack()),
      "DELETE",
      handler
    );
  }

  patch(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFileFromCallStack()),
      "PATCH",
      handler
    );
  }

  options(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFileFromCallStack()),
      "OPTIONS",
      handler
    );
  }

  head(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFileFromCallStack()),
      "HEAD",
      handler
    );
  }

  connect(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFileFromCallStack()),
      "CONNECT",
      handler
    );
  }

  trace(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFileFromCallStack()),
      "TRACE",
      handler
    );
  }
}

