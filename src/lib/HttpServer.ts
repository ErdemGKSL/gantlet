// const http = require('http');
import http from 'http';
import { App, TCalculation } from './App';
import { Route, RouteMethods } from './Route';
import { Middleware } from './Middleware';

export class HttpServer {

  private server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
  public onError: (error: Error) => void = () => void 0;
  constructor(public port: number, public app: App) {
    this.server = http.createServer((req, res) => {
      let data = [];

      req.on('data', (chunk) => {
        data.push(chunk);
      });

      req.on('end', async () => {
        try {
          let body: { [k: string]: any } | string = {};
          switch (req.headers["content-type"]) {
            case "application/json": {
              body = JSON.parse(data.join(""));
              break;
            }
            case "application/x-www-form-urlencoded": {
              body = Object.fromEntries([...new URLSearchParams(data.join("")).entries()]);
              break;
            }
            default: {
              body = data;
              break;
            }
          }
          const url = new URL(req.url || "", `http://${req.headers.host}`);
          const query = Object.fromEntries([...url.searchParams.entries()]);
          const route = url.pathname.split("/").filter(Boolean);
          const method = req.method as RouteMethods;

          const lazyData = [];
          let isEventEmitter = false;

          const context = {
            req,
            res,
            body,
            query,
            params: {},
            stop: () => null,
            url,
            extra: {},
            send: async (data: any, lazy?: boolean) => {
              if (lazy) {
                lazyData.push(data);
                return;
              }

              if (!res.writableEnded && !isEventEmitter) {
                switch (typeof data) {
                  case "string": case "function": {
                    res.setHeader("Content-Type", "text/plain");
                    const content = data.toString();
                    res.setHeader("Content-Length", Buffer.byteLength(content));
                    await writeResponseDataWithEnd(res, content);
                    break;
                  }
                  case "number": case "boolean": case "object": {
                    if (data instanceof Buffer) {
                      if (!res.hasHeader("Content-Type")) res.setHeader("Content-Type", "application/octet-stream");
                      res.setHeader("Content-Length", Buffer.byteLength(data));
                      await writeResponseDataWithEnd(res, data);
                    } else {
                      res.setHeader("Content-Type", "application/json");
                      const content = JSON.stringify(data);
                      res.setHeader("Content-Length", Buffer.byteLength(content));
                      await writeResponseDataWithEnd(res, content);
                    }
                    break;
                  }
                  default: {
                    break;
                  }
                }
              }
            },
            startEventEmitter: () => {
              isEventEmitter = true;
              res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
              });

              res.write("\n", "utf-8");

              const eventEmitter = {
                emit: async (event: string, data: object) => {
                  const content = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
                  await writeData(res, content);
                },
                writeRaw: async (data: string) => {
                  await writeData(res, data);
                },
                destroy: async () => {
                  await writeResponseDataWithEnd(res, "");
                  res.destroy();
                },
                isAlive: () => res.destroyed === false
              }

              return eventEmitter;
            }
          };

          const response = await recursiveHandleRoutes(route, method, this.app.calculation, this.app, context);

          if (response !== undefined) {
            await context.send(response);
          }

          for (const data of lazyData) {
            await context.send(data);
          }

          this.app.bindings.express.emit(req as any, res as any);
        } catch (error) {
          this.onError(error as Error);
        }
      });
    })
  }

  public async listen(cb?: () => void) {
    this.server.listen(this.port, typeof cb === "function" ? cb : (() => void 0));
  }
}

function writeResponseDataWithEnd(res: http.ServerResponse, data: string | Buffer) {
  return new Promise<void>((resolve) => {
    res.end(data, () => resolve());
  });
}

function writeData(res: http.ServerResponse, data: string) {
  return new Promise<void>((resolve) => {
    res.write(data, () => resolve());
  });
}

function recursiveHandleRoutes(route: string[], method: RouteMethods, routeObj: TCalculation, app: App, ctx: HandlerContext, isRest = false) {
  return new Promise<any>(async (resolve) => {
    let resolved = false;
    let stopped = false;
    ctx.stop = () => stopped = true;
    if ("$middlewares" in routeObj) {
      for (const mWare of (routeObj.$middlewares as Middleware[])) {
        await mWare.handler(ctx);
        if (stopped) return resolve(undefined);
      }
    }

    if (route.length === 0 || isRest) {
      if ("$routes" in routeObj) {
        for (const route of (routeObj.$routes as Route[])) {
          if (route.method === ctx.req.method || route.method === "ALL") {
            const result = await route.handler(ctx);
            if (result !== undefined) {
              if (resolved === false) resolve(result);
              resolved = true;
            }
            if (stopped) return !resolved && resolve(undefined);
          }
        }
      }
    }

    if (isRest) {
      if (!resolved) resolve(undefined);
      return;
    }

    for (const key in routeObj) {
      if (isInParanthesis(key)) {
        const result = await recursiveHandleRoutes(route.slice(0), method, routeObj[key] as TCalculation, app, { ...ctx, extra: { ...ctx.extra } }, false);
        if (result !== undefined) {
          if (!resolved) resolve(result);
          resolved = true;
        }
      } else if (route.length >= 1) {
        if (key === route[0]) {
          const result = await recursiveHandleRoutes(route.slice(1), method, routeObj[key] as TCalculation, app, { ...ctx, extra: { ...ctx.extra } }, false);
          if (result !== undefined) {
            if (!resolved) resolve(result);
            resolved = true;
          }
        } else if (key.includes("[") && key.includes("]")) {
          const rest = key.match(/^\[\.\.\.([_a-zA-Z0-9\-]*)]$/)?.[1];
          if (rest) {
            ctx.params[rest] = route.join("/");
            const result = await recursiveHandleRoutes(route.slice(1), method, routeObj[key] as TCalculation, app, { ...ctx, extra: { ...ctx.extra } }, true);
            if (result !== undefined) {
              if (!resolved) resolve(result);
              resolved = true;
            }
          } else {
            const regex = new RegExp(
              "^" +
              key.replace(
                /\[([_a-zA-Z0-9\-]*)\]/g,
                "(?<$1>.*)"
              ) +
              "$"
            );

            const match = route[0].match(regex);

            if (match) {
              ctx.params = {
                ...ctx.params,
                ...(match.groups ?? {})
              }
              const result = await recursiveHandleRoutes(route.slice(1), method, routeObj[key] as TCalculation, app, { ...ctx, extra: { ...ctx.extra } }, false);
              if (result !== undefined) {
                if (!resolved) resolve(result);
                resolved = true;
              }
            }
          }

        }
      }
    }

    if (!resolved) resolve(undefined);
  });
}

export type Handler = (ctx: HandlerContext) => any | Promise<any>;

export interface HandlerContext {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  url: URL;
  body: { [k: string]: any } | string;
  query: { [k: string]: any };
  params: { [k: string]: any };
  extra: { [k: string]: any };
  stop: () => void;
  send: (data: any, lazy?: boolean) => Promise<void>;
  startEventEmitter: () => {
    emit: (event: string, data: object) => Promise<void>;
    writeRaw: (data: string) => Promise<void>;
    destroy: () => Promise<void>;
    isAlive: () => boolean;
  }
}

function isInParanthesis(str: string) {
  if (str.startsWith("(") && str.endsWith(")")) {
    let left = 0;
    let right = 0;
    for (const char of str) {
      switch (char) {
        case "(": {
          left++;
          break;
        }
        case ")": {
          right++;
          break;
        }
      }
    }
    return left === right;
  }
  return false;
}