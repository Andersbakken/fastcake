var logOutput;
var ui;
var messageDiv;
// var logs = [];
var receivers = {};
var activities = [];
var sequence = "";
var pendingMessages = {};

function updateUI()
{
    if (!ui)
        ui = document.getElementById('ui');
    var text = "<b>Receivers:</b>\n";
    var id;
    for (id in receivers) {
        text += "    <i>id: " + id + " name: " + receivers[id].name + " ipAddress: " + receivers[id].ipAddress + "</i>\n";
    }
    text += "\n<b>Activities:</b>\n";
    for (var i=0; i<activities.length; ++i) {
        text += "activityId: " + activities[i].activityId + " status: " + activities[i].status + " receiverId: " + receivers[i].receiverId + "\n";
    }
    ui.innerHTML = text;
}

window.onkeypress = function(ev)
{
    if (!messageDiv)
        messageDiv = document.getElementById("message");
    switch (ev.charCode) {
    case 108:
        sequence = "l";
        break;
    case 115:
        sequence = "s";
        break;
    case 13:
        if (sequence.length >= 2) {
            var id = parseInt(sequence.substr(1));
            var receiver = receivers[id];
            if (sequence[0] == 's') {
                cast.stopActivity(id, function(activityStatus) {
                    log("got stopActivity callback", activityStatus);
                });

            } else {
                if (!receiver) {
                    messageDiv.innerHTML("Invalid id " + id);
                    sequence = "";
                    return;
                }
                cast.launch(new Cast.LaunchRequest(receiver.activityType, receiver),
                            function(activityStatus) {
                                log("got launch callback", activityStatus);
                            });
                messageDiv.innerHTML = "Launched app for receiver " + id;
            }
            sequence = "";
        }
        return;
    default:
        if (sequence.length > 0 && ev.charCode >= 48 && ev.charCode <= 57) {
            sequence += String.fromCharCode(ev.charCode);
        } else {
            sequence = "";
        }
    }

    if (sequence.length === 0) {
        messageDiv.innerHTML = "Press l or s followed by numbers and <enter>";
    } else {
        if (sequence[0] == 'l') {
            messageDiv.innerHTML = "Launch ";
        } else {
            messageDiv.innerHTML = "Stop ";
        }
        messageDiv.innerHTML += sequence.substr(1);
    }
    // log(ev);
};

function log()
{
    if (!logOutput)
        logOutput = document.getElementById('logOutput');

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
        if (line.length && line[line.length - 1] !== ' ')
            line += ' ';
        line += txt;
    }
    if (logOutput.innerHTML && logOutput.innerHTML.length > 0)
        logOutput.innerHTML += '\n';
    logOutput.innerHTML += line;
    // logs.unshift(line);
    // while (logs.length > 20)
    //     logs.pop();

    // var t = '';
    // for (var i=0; i<logs.length; ++i) {
    //     if (i > 0)
    //         t += '\n';
    //     t += logs[i];
    // }
    // logOutput.innerHTML = t;
}

var connection;
var role;
var cast;

function start()
{
    var query = {};
    var q = window.location.search.substring(1);
    var vars = q.split('&');
    for (var i = 0; i < vars.length; i++) {
        if (vars[i].length) {
            var pair = vars[i].split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
    }
    // log(query);
    // log('Started');

    // var id = query['id'] || 'test';
    role = query['role'] || 'sender';
    if (role !== 'sender' && role !== 'receiver')
        throw new Error('Invalid role ' + role);
    var fastcakeHost = query['fastcakeHost'] || 'localhost:6363';
    var activityType = '';
    var name = '';
    var ipAddress = '';
    if (role === 'receiver') {
        activityType = '&activityType=' + encodeURIComponent(query['activityType'] || 'netflix');
        name = '&name=' + encodeURIComponent(query['name'] || 'testName');
        ipAddress = '&ipAddress=' + encodeURIComponent(query['ipAddress'] || '127.0.0.1');
    }

    var url = 'ws://' + fastcakeHost + '/fastcake?role=' + role + activityType + name + ipAddress;
    // log(url);

    cast = new Cast.API();
    connection = new WebSocket(url);
    connection.onopen = function() {
        log(role + ' connected ' + url);
    };
    connection.onerror = function(error) {
        log(role + ' error ' + url, error);
    };
    connection.onclose = function(event) {
        log(role + ' closed ' + url, event.code, event.reason);
    };
    connection.onmessage = function(msg) {
        var data = JSON.parse(msg.data);
        // log("got message", data);
        if (!data.fastcake)
            return;
        switch (data.type) {
        case 'log':
            log("Log message from remote server: " + data.log);
            return;
        case 'response':
        }
        cast._receiveMessage(data);
    };

    cast._sendMessage = function(params, cb) {
        params.fastcake = true;
        connection.send(JSON.stringify(params));
    };

    cast.addReceiverListener("netflix",
                             function(r) {
                                 receivers = r;
                                 updateUI();
                             });
}

