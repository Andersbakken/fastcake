var url = require("url");
var ws = require("ws");
var port = 6363;

var server = new ws.Server({port: port});
var controllers = [];
var targets = [];

function send(connection, message)
{
    if (typeof(message) === "object")
        message = JSON.stringify(message);
    //console.log("->" + message);
    try {
        connection.send(message);
    } catch (e) {
        console.log("Couldn't send message, dropping:");
        console.log(e);
        return false;
    }
    return true;
}

function updateTargets()
{
    for (var i=0; i<controllers.length; ++i) {


    }
}

server.on("connection", function(connection) {
    var requestUrl = url.parse(connection.upgradeReq.url, true);
    var response = JSON.stringify(requestUrl, null, 4);
    // for (var i in connection._receiver) {
    //     var val = connection._receiver[i];
    //     if (typeof val !== "function")
    //         response += i + ": " + connection._receiver[i] + "\n";
    // }
    if (requestUrl.pathname === '/controller') {
        controllers.push(connection);
    } else if (requestUrl.pathname === '/target') {
        targets.push(connection);
    } else {
        send(connection, "Invalid url");
        return;
    }

    send(connection, "You're connected " + response);

    // var pageUrl =
    // var slashIdx = pageUrl.lastIndexOf("/");
    // console.log("Inspector connected!");
    // setTimeout(function() { sendState(ws); }, 1000);
    // clients.push(ws);
    // connection.on("message", function(msg) {
    //     try {
    //         handleMessage(ws, JSON.parse(msg));
    //     } catch (err) {
    //         console.log("Error parsing WebSocket message " + err);
    //         console.log(msg);
    //     }
    // });
    // connection.on("close", function(code) {
    //     console.log("Inspector disconnected(" + code + ")!");
    //     var idx = clients.indexOf(ws);
    //     if (idx != -1)
    //         clients.splice(idx, 1);
    //     else
    //         console.log("Unable to find socket in list of clients!");
    // });
});
