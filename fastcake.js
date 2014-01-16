var logOutput;
var logs = [];
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
        if (line.length)
            line += ' ';
        line += txt;
    }
    logs.unshift(line);
    while (logs.length > 20)
        logs.pop();

    var t = '';
    for (var i=0; i<logs.length; ++i) {
        if (i > 0)
            t += '\n';
        t += logs[i];
    }
    logOutput.innerHTML = t;
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
    var activityType = query['activityType'];
    if (!activityType && role === 'receiver')
        activityType = 'foobar';

    var url = 'ws://' + fastcakeHost + '/?role=' + role + '&activityType=' + encodeURIComponent(activityType);

    connection = new WebSocket('ws://' + fastcakeHost + '/?role=' + role + '&id=' + encodeURIComponent(id));
    connection.onopen = function() {
        log(role + ' connected');
        cast = new Cast.Api;
    };
    connection.onerror = function(error) {
        log(role + ' error', error);
    };
    connection.onmessage = function(msg) {
        cast._receiveMessage(msg);
    };
}
