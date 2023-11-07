import type { PathLike } from "fs";

export interface BuildConfig {
  adapter: Adapter;
  app: PathLike;
  entry: PathLike;
}

export interface Adapter {
  build: (config: BuildConfig, appPath: string, directory: PathLike) => Promise<void>
}

export * from "./AdapterNode";