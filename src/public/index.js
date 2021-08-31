const express = require("express");
const app = express();

app.use(express.static(__dirname + "/app"));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: `${__dirname}/app` });
});

app.get("/error", (req, res) => {
  res.sendFile("error.html", { root: `${__dirname}/app` });
});

const PORT = process.env.PORT;

app.listen(PORT || 5000, () => {
  console.log(`App has started.`);
});
