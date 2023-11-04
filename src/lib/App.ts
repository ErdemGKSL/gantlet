import { PathLike } from "fs";
import path from "path";
import { getFilePathFromCallStack } from "./getFilePathFromCallStack";
import { Route, RouteMethods } from "./Route";
import { Middleware } from "./Middleware";
import fs from "fs/promises";
import { Handler, HttpServer } from "./HttpServer";

type TCalculationResult = {
  $routes?: Route[];
  $middlewares?: Middleware[];
}

export type TCalculation = {
  [key: string]: TCalculationResult | TCalculation;
}

function recursiveComponentSet(obj: TCalculationResult, path: string[], component: Route | Middleware) {
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
  private middlewares: Middleware[] = [];
  public calculation: TCalculation = {};
  private httpServer: HttpServer;

  constructor(routesPath?: PathLike) {
    this.path = routesPath ? path.resolve(process.cwd(), routesPath.toString()) : path.resolve(getFilePathFromCallStack(), "./routes")
  }

  public async listen(port: number, cb?: () => void, onError?: (error: Error) => void) {
    await recursiveImport(this.path);
    this.httpServer = new HttpServer(port, this);
    onError && (this.httpServer.onError = onError);
    await this.httpServer.listen(cb);
  }

  private addRoute(routePath: string, method: RouteMethods, handler: Handler) {
    const routeArray = routePath.split(/\\+/);
    if (routeArray.at(-1).startsWith("index.")) routeArray.pop();
    else if (routeArray.at(-1).endsWith(".ts") || routeArray.at(-1).endsWith(".js"))
      routeArray[routeArray.length - 1] = routeArray.at(-1).slice(0, routeArray.at(-1).length - 3);
    const route = new Route(this, routeArray, method, handler);
    recursiveComponentSet(this.calculation, routeArray, route);
    this.routes.push(route);
  }

  private addMiddleware(mWarePath: string, handler: Handler) {
    const mWareArray = mWarePath.split(/\\+/);
    if (mWareArray.at(-1).startsWith("index.")) mWareArray.pop();
    else if (mWareArray.at(-1).endsWith(".ts") || mWareArray.at(-1).endsWith(".js"))
      mWareArray[mWareArray.length - 1] = mWareArray.at(-1).slice(0, mWareArray.at(-1).length - 3);
    const mWare = new Middleware(this, mWareArray, handler);
    recursiveComponentSet(this.calculation, mWareArray, mWare);
    this.middlewares.push(mWare);
  }

  public use(handler: Handler) {
    const mWarePath = path.relative(this.path, getFilePathFromCallStack());
    this.addMiddleware(
      mWarePath,
      handler
    );
  }

  public get(handler: Handler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "GET",
      handler
    );
  }

  public post(handler: Handler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "POST",
      handler
    );
  }

  public put(handler: Handler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "PUT",
      handler
    );
  }

  public delete(handler: Handler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "DELETE",
      handler
    );
  }

  public patch(handler: Handler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "PATCH",
      handler
    );
  }

  public options(handler: Handler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "OPTIONS",
      handler
    );
  }

  public head(handler: Handler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "HEAD",
      handler
    );
  }

  public connect(handler: Handler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "CONNECT",
      handler
    );
  }

  public trace(handler: Handler) {
    this.addRoute(
      path.relative(this.path, getFilePathFromCallStack()),
      "TRACE",
      handler
    );
  }
}

async function recursiveImport(scanPath: string) {
  const target = await fs.stat(scanPath);
  if (target.isFile()) {
    await import(scanPath);
  } else if (target.isDirectory()) {
    const files = await fs.readdir(scanPath);
    for (const file of files) {
      await recursiveImport(path.resolve(scanPath, file));
    }
  }
}
