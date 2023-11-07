import path from "path";
import fs from "fs";
import { findPackageJsonDirectory } from "./init";

export async function build() {
 
  const directory = findPackageJsonDirectory(path.resolve(process.cwd()));

  const configPath = path.resolve(directory, "gantlet.config.js");

  if (!fs.existsSync(configPath)) throw new Error("Config file not found");

  const buildConfig = await import(configPath);

  await buildConfig.adapter.build(
    buildConfig,
    path.resolve(directory, buildConfig.app),
    directory
  );
}
