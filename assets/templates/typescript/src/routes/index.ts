// URL =  localhost:port/
import app from "@src/index";

app.use(async ({ extra }) => {
  extra.hello = "world";
});

app.get(() => ({ hello: "world" }))