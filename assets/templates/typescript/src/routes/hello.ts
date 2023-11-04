// URL =  localhost:port/hello
import app from "@src/index";

app.get(({ query, extra }) => {
  return {
    query,
    extra
  }
});