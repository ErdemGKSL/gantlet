import path from "path";
import fs from "fs";
import chalk from "chalk";
import { prompt as typelessPrommpt } from "enquirer";
import { execAsync } from "stuffs";
interface PromptOptions<T extends string> {
  type: "select" | "confirm" | "input" | "number" | "autocomplete" | "form" | "editable" | "list" | "scale" | "sort" | "snippet" | "survey" | "password" | "invisible" | "list" | "multiselect" | "quiz" | "text" | "toggle" | "date" | "time" | "datetime" | "list" | "tree" | "fuzzy" | "autocomplete" | "editable" | "form" | "multiselect" | "select" | "survey" | "snippet" | "scale" | "sort" | "quiz" | "text" | "toggle" | "date" | "time" | "datetime" | "list" | "tree" | "fuzzy" | "autocomplete" | "editable" | "form" | "multiselect" | "select" | "survey" | "snippet" | "scale" | "sort" | "quiz" | "text" | "toggle" | "date" | "time" | "datetime" | "list" | "tree" | "fuzzy" | "autocomplete" | "editable" | "form" | "multiselect" | "select" | "survey" | "snippet" | "scale" | "sort" | "quiz" | "text" | "toggle" | "date" | "time" | "datetime" | "list" | "tree" | "fuzzy" | "autocomplete" | "editable" | "form" | "multiselect" | "select" | "survey" | "snippet" | "scale" | "sort" | "quiz" | "text" | "toggle" | "date" | "time" | "datetime" | "list" | "tree" | "fuzzy" | "autocomplete" | "editable" | "form" | "multiselect" | "select" | "survey" | "snippet" | "scale" | "sort" | "quiz" | "text" | "toggle" | "date" | "time" | "datetime" | "list" | "tree" | "fuzzy" | "autocomplete" | "editable" | "form" | "multiselect" | "select" | "survey" | "snippet" | "scale"
  name: T
  message: string
  initial?: string | number | boolean
  choices?: string[] | number[] | boolean[] | { name: string; message?: string; value?: string }[]
  multiline?: boolean
  min?: number
  max?: number
  delay?: number
  float?: boolean
  round?: boolean
  major?: number
  minor?: number
}

function prompt<T extends string>(ctx: PromptOptions<T>) {
  return typelessPrommpt(ctx as any) as Promise<{ [key in T]: any }>;
}

export async function init(directory: string) {
  const directoryPath = path.resolve(process.cwd(), directory);
  if (!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath);

  const fileSize = fs.readdirSync(directoryPath).length;
  let packageJsonDirectory: string;
  if (fileSize > 0) {
    console.log(chalk.red("The directory is not empty!"));
    const { continueInit } = await prompt({
      type: "confirm",
      name: "continueInit",
      message: "Do you want to continue?",
      initial: false
    });

    if (!continueInit) return;

    packageJsonDirectory = findPackageJsonDirectory(directoryPath);
    if (!packageJsonDirectory) {
      await execAsync(`npm init -y`, directoryPath).catch(() => {});
      packageJsonDirectory = path.resolve(directoryPath);
    }
  } else {
    await execAsync(`npm init -y`, directoryPath).catch(() => {});
    packageJsonDirectory = path.resolve(directoryPath);
  }
  let installCommand = "npm install"
  if (fs.existsSync(path.resolve(packageJsonDirectory, "yarn.lock"))) {
    await execAsync(`yarn add gantlet@latest`, packageJsonDirectory).catch(() => {});
    installCommand = "yarn add"
  } else if (fs.existsSync(path.resolve(packageJsonDirectory, "pnpm-lock.yaml"))) {
    await execAsync(`pnpm install gantlet@latest`, packageJsonDirectory).catch(() => {});
    installCommand = "pnpm install"
  } else if (fs.existsSync(path.resolve(packageJsonDirectory, "bun.lockb"))) {
    await execAsync(`bun install gantlet@latest`, packageJsonDirectory).catch(() => {});
    installCommand = "bun install"
  } else {
    await execAsync(`npm install gantlet@latest`, packageJsonDirectory).catch(() => {});
  }

  const { useTypeScript } = await prompt({
    type: "confirm",
    name: "useTypeScript",
    message: "Do you want to use TypeScript?",
    initial: true
  });

  if (useTypeScript) {
    await execAsync(`${installCommand} typescript ts-node @types/node tslib tsconfig-paths dotenv`, packageJsonDirectory).catch(() => {});
    copyFolderIntoFolder(path.resolve(__dirname, "../../assets/skeletons/typescript"), directoryPath);
  } else {
    await execAsync(`${installCommand} dotenv`, packageJsonDirectory).catch(() => {});
  }
}

function findPackageJsonDirectory(directoryPath: string, depth = 0) {
  const packageJsonPath = path.resolve(directoryPath, "package.json");
  if (fs.existsSync(packageJsonPath)) return path.resolve(path.dirname(packageJsonPath));
  if (depth > 10) return null;
  const parentDirectoryPath = path.resolve(directoryPath, "..");
  if (parentDirectoryPath === directoryPath) return null;
  return findPackageJsonDirectory(parentDirectoryPath, depth + 1);
}

function copyFolderIntoFolder(from: string, to: string) {
  if (!fs.existsSync(to)) fs.mkdirSync(to);

  const files = fs.readdirSync(from);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.resolve(from, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      copyFolderIntoFolder(filePath, path.resolve(to, file));
    } else {
      fs.copyFileSync(filePath, path.resolve(to, file));
    }
  }
}