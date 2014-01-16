var logOutput;
var logs = [];
function log()
{
    if (!logOutput)
        logOutput = document.getElementById("logOutput");

    var line = "";
    var i;
    for (i=0; i<arguments.length; ++i) {
        var txt = arguments[i];
        if (typeof txt !== "string") {
            try {
                var json = JSON.stringify(txt);
                txt = json;
            } catch (err) {
                txt += txt;
            }
        }
        if (line.length)
            line += " ";
        line += txt;
    }
    logs.unshift(line);
    while (logs.length > 20)
        logs.pop();

    var t = "";
    for (var i=0; i<logs.length; ++i) {
        if (i > 0)
            t += "\n";
        t += logs[i];
    }
    logOutput.innerHTML = t;
}

var target, controller;
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
    // log("Started");

    var url = document.URL;

    var id = query["id"] || "test";

    target = new WebSocket("ws://localhost:6363/target?id=" + encodeURIComponent(id));
    target.onopen = function() { log("target connected"); };
    target.onerror = function(error) { log("target error", error); };
    target.onmessage = onTargetMessage;

    controller = new WebSocket("ws://localhost:6363/controller");
    controller.onopen = function() { log("controller connected"); };
    controller.onerror = function(error) { log("controller error", error); };
    controller.onmessage = onControllerMessage;
}

function onTargetMessage(msg)
{
    log("target", msg.data);

}
function onControllerMessage(msg)
{
    log("controller", msg.data);
}
