// URL =  localhost:port/hello
const app = require("../index");

app.get(({ query, extra }) => {
  return {
    query,
    extra
  }
});