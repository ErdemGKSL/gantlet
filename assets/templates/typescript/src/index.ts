import { App } from "gantlet";
import path from "path";

import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const app = new App(); // or new App("./src/routes")

app.listen(parseInt(process.env.PORT), () => {
  console.log("Listening on port " + process.env.PORT);
});

export default app;