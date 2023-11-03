import { PathLike } from "fs";
import path from "path";
import { getFilePathFromCallStack } from "./getFilePathFromCallStack";
import { Route, RouteHandler, RouteMethods } from "./Route";
import { MiddleWare, MiddleWareHandler } from "./Middleware";

type TCalculationResult = {
  $routes?: Route[];
  $middlewares?: MiddleWare[];
} & TCalculation

type TCalculation = {
  [key: string]: TCalculationResult | TCalculation;
}

function recursiveComponentSet(obj: TCalculationResult, path: string[], component: Route | MiddleWare) {
  if (path.length === 0) {
    if (component instanceof Route) {
      if (!obj.$routes) obj.$routes = [];
      obj.$routes.push(component);
    } else {
      if (!obj.$middlewares) obj.$middlewares = [];
      obj.$middlewares.push(component);
    }
    return;
  }
  if (!obj[path[0]]) obj[path[0]] = {};
  recursiveComponentSet(obj[path[0]] as TCalculationResult, path.slice(1), component);
}

export class App {

  path: string;
  private routes: Route[] = [];
  private middlewares: MiddleWare[] = [];
  private calculation: TCalculation = {};
  constructor(routesPath?: PathLike) {
    this.path = routesPath ? path.resolve(process.cwd(), routesPath.toString()) : path.resolve(getFilePathFromCallStack(), "./routes")
  }

  private addRoute(routePath: string, method: RouteMethods, handler: RouteHandler) {
    const routeArray = routePath.split(/\\+/);
    if (routeArray.at(-1).startsWith("index.")) routeArray.pop();
    const route = new Route(this, routeArray, method, handler);
    recursiveComponentSet(this.calculation, routeArray, route);
    this.routes.push(route);
  }

  private addMiddleware(mWarePath: string, handler: MiddleWareHandler) {
    const mWareArray = mWarePath.split(/\\+/);
    if (mWareArray.at(-1).startsWith("index.")) mWareArray.pop();
    const mWare = new MiddleWare(this, mWareArray, handler);
    recursiveComponentSet(this.calculation, mWareArray, mWare);
    this.middlewares.push(mWare);
  }

  public use(handler: MiddleWareHandler) {
    const mWarePath = path.relative(this.path, getFilePathFromCallStack());
    this.addMiddleware(
      mWarePath,
      handler
    );
  }

  public get(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "GET",
      handler
    );
  }

  public post(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "POST",
      handler
    );
  }

  public put(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "PUT",
      handler
    );
  }

  public delete(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "DELETE",
      handler
    );
  }

  public patch(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "PATCH",
      handler
    );
  }

  public options(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "OPTIONS",
      handler
    );
  }

  public head(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "HEAD",
      handler
    );
  }

  public connect(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "CONNECT",
      handler
    );
  }

  public trace(handler: RouteHandler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "TRACE",
      handler
    );
  }
}

