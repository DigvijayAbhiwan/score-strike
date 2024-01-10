const express = require("express");
const { createServer } = require("http");
const path = require("path");
const initializeSocket = require("./socketEvents");

const PORT = 5000;

const app = express();
const server = createServer(app);

app.use(express.static(path.join(__dirname, "public")));

initializeSocket(server);

server.listen(PORT, (error) => {
  if (error) console.log(`Error: ${error}`);
  console.log(`Server started in the port: ${PORT}`);
});
