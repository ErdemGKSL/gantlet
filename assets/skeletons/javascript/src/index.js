const { App } = require("gantlet");
const path = require("path");

const dotenv = require("dotenv");
dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const app = new App(); // or new App("./src/routes")

app.listen(parseInt(process.env.PORT), () => {
  console.log("Listening on port " + process.env.PORT);
});

module.exports =  app;