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

          const context = {
            req, res, body, query, params: {}, stop: () => null, url, extra: {}, send: async (data: any) => {
              if (!res.writableEnded) {
                switch (typeof data) {
                  case "string": case "function": {
                    res.setHeader("Content-Type", "text/plain");
                    res.setHeader("Content-Length", new Blob([data.toString()]).size);
                    const chunks = data.toString().match(/.{1,512}/gsm);
                    for (const chunk of chunks ?? []) await writeResponseData(res, chunk);
                    break;
                  }
                  case "number": case "boolean": case "object": {
                    res.setHeader("Content-Type", "application/json");
                    const content = JSON.stringify(data);
                    res.setHeader("Content-Length", new Blob([content]).size);
                    const chunks = content.match(/.{1,512}/gsm);
                    for (const chunk of chunks ?? []) await writeResponseData(res, chunk);
                    break;
                  }
                  default: {
                    break;
                  }
                }
                await new Promise<void>((resolve) => {
                  res.end(() => resolve());
                });
              }
            }
          };

          const response = await recursiveHandleRoutes(route, method, this.app.calculation, this.app, context);
          await context.send(response);
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

function writeResponseData(res: http.ServerResponse, data: string) {
  return new Promise<void>((resolve) => {
    res.write(data, () => resolve());
  });
}

function recursiveHandleRoutes(route: string[], method: RouteMethods, routeObj: TCalculation, app: App, ctx: HandlerContext) {
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

    if (route.length === 0) {
      if ("$routes" in routeObj) {
        for (const route of (routeObj.$routes as Route[])) {
          if (route.method === ctx.req.method) {
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

    for (const key in routeObj) {
      if (isInParanthesis(key)) {
        const result = await recursiveHandleRoutes(route.slice(0), method, routeObj[key] as TCalculation, app, { ...ctx, extra: { ...ctx.extra } });
        if (result !== undefined) {
          if (!resolved) resolve(result);
          resolved = true;
        }
      } else if (route.length >= 1) {
        if (key === route[0]) {
          const result = await recursiveHandleRoutes(route.slice(1), method, routeObj[key] as TCalculation, app, { ...ctx, extra: { ...ctx.extra } });
          if (result !== undefined) {
            if (!resolved) resolve(result);
            resolved = true;
          }
        } else if (key.includes("[") && key.includes("]")) {
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
            const result = await recursiveHandleRoutes(route.slice(1), method, routeObj[key] as TCalculation, app, { ...ctx, extra: { ...ctx.extra } });
            if (result !== undefined) {
              if (!resolved) resolve(result);
              resolved = true;
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
  send: (data: any) => Promise<void>;
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