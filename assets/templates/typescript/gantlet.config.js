const { AdapterNode } = require("gantlet/build");

/** @type {import("gantlet/build").BuildConfig} */
module.exports = {
  adapter: new AdapterNode(),
  app: "./dist/index.js"
}