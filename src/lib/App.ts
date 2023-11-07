import { PathLike } from "fs";
import path from "path";
import { getFilePathFromCallStack } from "./getFilePathFromCallStack";
import { Route, RouteMethods } from "./Route";
import { Middleware } from "./Middleware";
import fs from "fs/promises";
import { Handler, HttpServer } from "./HttpServer";
import { ExpressHandler } from "./ExpressHandler";


export type TCalculation = {
  $routes?: Route[];
  $middlewares?: Middleware[];
  [key: string]: TCalculation | Route[] | Middleware[];
}

function recursiveComponentSet(obj: TCalculation, path: string[], component: Route | Middleware) {
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
  recursiveComponentSet(obj[path[0]] as TCalculation, path.slice(1), component);
}

class Bindings {

  express: ExpressHandler;
  constructor(private app: App) {
    this.express = new ExpressHandler(this.app);
  }

}

export class App {

  path: string;
  private routes: Route[] = [];
  private middlewares: Middleware[] = [];
  public calculation: TCalculation = {};
  private httpServer: HttpServer;
  public bindings = new Bindings(this);

  constructor(routesPath?: PathLike) {
    this.path = routesPath ?
      path.resolve(process.cwd(), routesPath.toString()) :
      path.resolve(path.dirname(getFilePathFromCallStack()), "./routes")
  }

  public async listen(port: number, cb?: () => void, onError?: (error: Error) => void) {
    if (global["__gantlet_build"]) return;
    await recursiveImport(this.path);
    if (!this.httpServer) this.httpServer = new HttpServer(port, this);
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


  public use(path: string, handler: Handler): void;
  public use(handler: Handler): void;
  public use(...args: any[]) {
    const handler = args.pop();
    const _path = args.pop();

    const mWarePath = _path || path.relative(this.path, getFilePathFromCallStack());
    this.addMiddleware(
      mWarePath,
      handler
    );
  }

  public all(path: string, handler: Handler): void;
  public all(handler: Handler): void;
  public all(...args: any[]) {
    const handler = args.pop();
    const _path = args.pop();
    this.addRoute(
      _path || path.relative(this.path, getFilePathFromCallStack()),
      "ALL",
      handler
    );
  }

  public get(path: string, handler: Handler): void;
  public get(handler: Handler): void;
  public get(...args: any[]) {
    const handler = args.pop();
    const _path = args.pop();
    this.addRoute(
      _path || path.relative(this.path, getFilePathFromCallStack()),
      "GET",
      handler
    );
  }

  public post(path: string, handler: Handler): void;
  public post(handler: Handler): void;
  public post(...args: any[]) {
    const handler = args.pop();
    const _path = args.pop();
    this.addRoute(
      _path || path.relative(this.path, getFilePathFromCallStack()),
      "POST",
      handler
    );
  }

  public put(path: string, handler: Handler): void;
  public put(handler: Handler): void;
  public put(...args: any[]) {
    const handler = args.pop();
    const _path = args.pop();
    this.addRoute(
      _path || path.relative(this.path, getFilePathFromCallStack()),
      "PUT",
      handler
    );
  }

  public delete(path: string, handler: Handler): void;
  public delete(handler: Handler): void;
  public delete(...args: any[]) {
    const handler = args.pop();
    const _path = args.pop();
    this.addRoute(
      _path || path.relative(this.path, getFilePathFromCallStack()),
      "DELETE",
      handler
    );
  }

  public patch(path: string, handler: Handler): void;
  public patch(handler: Handler): void;
  public patch(...args: any[]) {
    const handler = args.pop();
    const _path = args.pop();
    this.addRoute(
      _path || path.relative(this.path, getFilePathFromCallStack()),
      "PATCH",
      handler
    );
  }

  public options(path: string, handler: Handler): void;
  public options(handler: Handler): void;
  public options(...args: any[]) {
    const handler = args.pop();
    const _path = args.pop();
    this.addRoute(
      _path || path.relative(this.path, getFilePathFromCallStack()),
      "OPTIONS",
      handler
    );
  }

  public head(path: string, handler: Handler): void;
  public head(handler: Handler): void;
  public head(...args: any[]) {
    const handler = args.pop();
    const _path = args.pop();
    this.addRoute(
      _path || path.relative(this.path, getFilePathFromCallStack()),
      "HEAD",
      handler
    );
  }

  public connect(path: string, handler: Handler): void;
  public connect(handler: Handler): void;
  public connect(...args: any[]) {
    const handler = args.pop();
    const _path = args.pop();
    this.addRoute(
      _path || path.relative(this.path, getFilePathFromCallStack()),
      "CONNECT",
      handler
    );
  }

  public trace(path: string, handler: Handler): void;
  public trace(handler: Handler): void;
  public trace(...args: any[]) {
    const handler = args.pop();
    const _path = args.pop();
    this.addRoute(
      _path || path.relative(this.path, getFilePathFromCallStack()),
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
