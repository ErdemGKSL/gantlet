#!/usr/bin/env node

export * from "./lib/App";
export * from "./lib/HttpServer";
export * from "./lib/Route";
export * from "./lib/Middleware";

import { program } from "commander";
import * as scripts from "./scripts";

if (require.main === module) {

  program
    .command("init")
      .description("Initialize a new project")
      .argument("<directory>", "The directory to initialize the project in")
      .action(scripts.init)
      
  program.parse(process.argv);
}

