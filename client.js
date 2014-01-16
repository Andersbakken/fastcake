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
    log("Started");

    var url = document.URL;

    target = new WebSocket("ws://localhost:6363/target");
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
