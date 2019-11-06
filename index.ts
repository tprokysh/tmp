import express = require("express");
import http = require("http");
import io = require("socket.io");
import fse = require("fs-extra");
import path = require("path");
import cheerio = require("cheerio");
import request = require("request");
import chance = require("chance");

const app: express.Application = express();
const server: http.Server = new http.Server(app);
const con: io.Server = io(server);
const random: Chance.Chance = chance.Chance();

let log = (type: string, content: string, file: string) => {
  fse.appendFile(path.join(__dirname, file), content, (err) => {
    if (err) throw err;
    console.log(`${type} logged in ${file}`);
  });
};

// CONNECT

con.on("connection", (socket: any) => {
  // connection log string
  let content =
    `[${socket.handshake.time}] ` +
    `${socket.handshake.address} "` +
    `${socket.handshake.headers["user-agent"]}" - New connection\n\n`;

  log("Connection", content, "./connectionLog.txt");

  // JSON

  socket.on("receivedJsonFromClient", (data: any) => {
    //send log string
    let content =
      `[${socket.handshake.time}] ` +
      `${socket.handshake.address} "` +
      `${socket.handshake.headers["user-agent"]}" - New JSON: ${data}, `;

    data = JSON.parse(data);
    let query = data["query"].replace(/ /g, "+");
    let url = `https://www.bing.com/search?q=${query}`;

    //request search
    request(url, (res: any, body: any) => {
      let $ = cheerio.load(body);
      let results = $(".sb_count").text();
      content += `${results}\n\n`;

      log("JSON", content, "./sendLog.txt");
    });
  });

  // RAW DATA

  socket.on("receivedRawFromClient", (data: string) => {
    let content =
      `[${socket.handshake.time}] ` +
      `${socket.handshake.address} "` +
      `${socket.handshake.headers["user-agent"]}" - New RAW: (${data})\n\n`;

    log("RAW", content, "./sendLog.txt");
  });

  // BINARY FILE

  socket.on("receivedFileFromClient", (data: string) => {
    let content =
      `[${socket.handshake.time}] ` +
      `${socket.handshake.address} "` +
      `${socket.handshake.headers["user-agent"]}" - New file: ${socket.handshake.headers.referer}public/${data}\n\n`;

    if (!fse.existsSync("./public")) {
      fse.mkdir("./public");
    }

    fse.readFile(data, (err, buffer) => {
      fse.writeFile("./public/test.jpg", buffer);
    });

    log("File", content, "./sendLog.txt");
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

server.listen(3000, () => {
  console.log("HTTP server started on port 3000");
});
