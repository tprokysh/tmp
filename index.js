"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var http = require("http");
var io = require("socket.io");
var fse = require("fs-extra");
var path = require("path");
var cheerio = require("cheerio");
var request = require("request");
var chance = require("chance");
var app = express();
var server = new http.Server(app);
var con = io(server);
var random = chance.Chance();
var log = function (type, content, file) {
    fse.appendFile(path.join(__dirname, file), content, function (err) {
        if (err)
            throw err;
        console.log(type + " logged in " + file);
    });
};
// CONNECT
con.on("connection", function (socket) {
    // connection log string
    var content = "[" + socket.handshake.time + "] " +
        (socket.handshake.address + " \"") +
        (socket.handshake.headers["user-agent"] + "\" - New connection\n\n");
    log("Connection", content, "./connectionLog.txt");
    // JSON
    socket.on("receivedJsonFromClient", function (data) {
        //send log string
        var content = "[" + socket.handshake.time + "] " +
            (socket.handshake.address + " \"") +
            (socket.handshake.headers["user-agent"] + "\" - New JSON: " + data + ", ");
        data = JSON.parse(data);
        var query = data.query.replace(" ", "+");
        var url = "https://www.bing.com/search?q=" + query + "&qs=n&form=QBLH&sp=-1&pq=hello&sc=8-5&sk=&cvid=5ADDE9B642004421A77FC7EF634DDD8A";
        //request search
        request(url, function (res, body) {
            var $ = cheerio.load(body);
            var results = $(".sb_count").text();
            content += results + "\n\n";
            log("JSON", content, "./sendLog.txt");
        });
    });
    // RAW DATA
    socket.on("receivedRawFromClient", function (data) {
        var content = "[" + socket.handshake.time + "] " +
            (socket.handshake.address + " \"") +
            (socket.handshake.headers["user-agent"] + "\" - New RAW: (" + data + ")");
        log("RAW", content, "./sendLog.txt");
    });
    // BINARY FILE
    socket.on("receivedFileFromClient", function (data) {
        var content = "[" + socket.handshake.time + "] " +
            (socket.handshake.address + " \"") +
            (socket.handshake.headers["user-agent"] + "\" - New file: " + socket.handshake.headers.referer + "public/" + data + "\n\n");
        if (!fse.existsSync("./public")) {
            fse.mkdir("./public");
        }
        fse.readFile(data, function (err, buffer) {
            fse.writeFile("./public/test.jpg", buffer);
        });
        log("File", content, "./sendLog.txt");
    });
});
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "/index.html"));
});
server.listen(5000, function () {
    console.log("HTTP server started on port 3000");
});
