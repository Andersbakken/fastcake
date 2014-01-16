var url = require("url");
var ws = require("ws");
var port = 6363;

var server = new ws.Server({port: port});
var receivers = {};
var nextReceiverId = 1;
var senders = [];
var nextSenderId = 1;

function log()
{
    var line = '';
    var i;
    for (i=0; i<arguments.length; ++i) {
        var txt = arguments[i];
        if (typeof txt !== 'string') {
            try {
                var json = JSON.stringify(txt);
                txt = json;
            } catch (err) {
                txt += txt;
            }
        }
        if (line.length)
            line += ' ';
        line += txt;
    }
    console.log(line);
}

function send(connection, message)
{
    if (typeof(message) === "object")
        message = JSON.stringify(message);

    try {
        connection.send(message);
    } catch (e) {
        console.log("Couldn't send message, dropping.");
        console.log(e);
        return false;
    }
    return true;
}

function updateReceivers()
{
    var all = {};
    var i;
    for (var activity in receivers) {
        var list = [];
        for (i=0; i<receivers[activity].length; ++i) {
            var r = receivers[activity][i];
            list.push({ipAddress:r.ipAddress, name:r.name,
                       id:r.id, isTabProtected:r.isTabProtected});
        }
        all[activity] = list;
    }
    var message = {fastcake:true, type:"targetsChanged", receivers:all};

    var msg = JSON.stringify(message);

    for (var i=0; i<senders.length; ++i) {
        send(senders[i].connection, msg);
    }
}

function onReceiverMessage(receiver, msg)
{
    log("Receiver message", msg);
}

function onReceiverClosed(receiver, code)
{
    log("Receiver closed", code);
    var r = receivers[receiver.activity];
    for (var i=0; i<r.length; ++i) {
        if (receiver.id == r[i].id) {
            r.splice(i, i);
            if (!r.length) {
                delete receivers[receiver.activity];
            }
            break;
        }
    }
    updateReceivers();
}

function onSenderMessage(sender, msg)
{
    log("Got message from sender", msg);
}

function onSenderClosed(sender, code)
{
    log("Sender closed", code);
    for (var i=0; i<senders.length; ++i) {
        if (senders[i].id == sender.id) {
            senders.splice(i, i);
            // need to notify receiver if connected maybe?
            break;
        }
    }
}

server.on("connection", function(connection) {
    var requestUrl = url.parse(connection.upgradeReq.url, true);
    if (requestUrl.pathname !== '/fastcake') {
        send(connection, "Wrong Path.");
        return;
    }
    var role = requestUrl.query.role;
    if (role !== 'receiver' && role !== 'sender') {
        send(connection, "Invalid role.");
        return;
    }
    var receiver = role === 'receiver';
    log(requestUrl.query);
    if (receiver) {
        if (!requestUrl.query.name) {
            connection.close(1000, 'Missing name');
            return;
        }
        if (!requestUrl.query.activityType) {
            connection.close(1000, 'No activityType');
            return;
        }

        if (!requestUrl.query.ipAddress) {
            connection.close('No ipAddress');
            return;
        }

        var r = { id:nextReceiverId++,
                  ipAddress:requestUrl.query.ipAddress,
                  name:!requestUrl.query.name,
                  activityType:!requestUrl.query.activityType,
                  isTabProtected: false,
                  connection:connection };
        if (!receivers[r.activityType])
            receivers[r.activityType] = [];
        receivers[r.activityType].push(r);
        connection.on("message", function(msg) { onReceiverMessage(r, msg); });
        connection.on("close", function(code) { onReceiverClosed(r, code); });
    } else {
        var s = {connection:connection, id:nextSenderId++};
        senders.push(s);
        connection.on("message", function(msg) { onSenderMessage(s, msg); });
        connection.on("close", function(code) { onSenderClosed(s, code); });
    }
    send(connection, {fastcake:true, type:"log", log:"You're connected"});
    updateReceivers();
});
