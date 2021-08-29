const express = require("express");
const app = express();

app.use(express.static(__dirname + "/app"));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: `${__dirname}/app` });
});

app.get("/error", (req, res) => {
  res.sendFile("error.html", { root: `${__dirname}/app` });
});

app.listen(5000, () => {
  console.log(`Got to http://localhost:5000`);
});
