// URL =  localhost:port/
const app = require("../index");

app.use(async ({ extra }) => {
  extra.hello = "world";
});

app.get(() => ({ hello: "world" }))