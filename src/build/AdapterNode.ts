import { Adapter, BuildConfig } from ".";
import { makeSureFileExists, makeSureFileExistsSync, makeSureFolderExists, makeSureFolderExistsSync } from "stuffs";
import escape from "regex-escape";
import path from "path";
import fs, { PathLike } from "fs";
import type { App } from "../lib/App";

export class AdapterNode implements Adapter {

  constructor() { }
  async build(config: BuildConfig, appPath: string, directory: PathLike): Promise<void> {
    global["__gantlet_build"] = true;
    const app: App = await import(appPath as string).then(m => m?.app ?? m?.default ?? m);

    if (app?.constructor?.name !== "App") {
      throw new Error("App not found");
    }

    const tempDir = path.resolve(directory.toString(), "./.gantlet");

    await makeSureFolderExists(
      tempDir
    );

    const routeDirPath = path.resolve(appPath, app.path);

    this.recursiveTranspile(appPath as string, routeDirPath, tempDir, "./");
  };

  private recursiveTranspile(mainAppPath: string, routesDirPath: string, buildDirPath: string, currentPath: string) {

    const currentDirPath = path.resolve(routesDirPath, currentPath);
    const currentBuildPath = path.resolve(buildDirPath, currentPath);

    const files = fs.readdirSync(currentDirPath);

    for (const file of files) {

      const filePath = path.resolve(currentDirPath, file);
      const buildFilePath = path.resolve(currentBuildPath, file);

      if (fs.statSync(filePath).isDirectory()) {
        this.recursiveTranspile(mainAppPath, routesDirPath, buildDirPath, path.join(currentPath, file));
      } else {
        let fileContent = fs.readFileSync(filePath, "utf-8");

        const relativePath = path.relative(
          path.dirname(filePath),
          mainAppPath,
        ).replaceAll("\\", "/")
          .replace(/\/index\.(t|j)s$/, "");
        const esAppImport = fileContent.match(
          new RegExp(
            "import\\s+(?:\\{[^}]*)?(App)(?:\\s+as\\s+([^\\s]+))?\\s*(?:[^}]*\\})?\\s+from\\s+"
            + '"' + escape(
              relativePath
            ) + '(?:\\/index(?:\\.(?:j|t)s)?)?"',
          )
        );

        const commonAppImport = fileContent.match(
          new RegExp(
            `(?:([a-zA-Z0-9_]+))\\s+=[^\\n]+require\\s*\\(`
            + '"' + escape(
              relativePath
            ) + '(?:\\/index(?:\\.(?:j|t)s)?)?"',
          )
        )

        const appImport = esAppImport?.[2] ?? esAppImport?.[1] ?? commonAppImport?.[1] ?? "app";

        fileContent = fileContent
          .replace(
            new RegExp(
              `(${escape(appImport)}(?:\\.default)?\\.(get|post|put|use|patch|delete|options|all|head|connect|trace)\\s*\\()`,
              "g"
            ),
            `$1${JSON.stringify(
              path.relative(
                routesDirPath,
                filePath.replaceAll("\\", "/").replace(/(\/index)?\.(t|j)s$/g, ""),
              ).replaceAll("\\", "/")
            )}, `
          );

        makeSureFolderExistsSync(path.dirname(buildFilePath));

        fs.writeFileSync(buildFilePath, fileContent);
      }

    }

  }

}