var Cast = {
    LaunchRequest: function LaunchRequest(activityType, receiver) {
        this.activityType = activityType;
        this.receiver = receiver;
        this.disconnectPolicy = "continue";
    },

    API: function API() {
        this.addReceiverListener = function addReceiverListener(activityType, listener) {
            if (!this._receiverListeners[activityType]) {
                this._receiverListeners[activityType] = [listener];
            } else {
                this._receiverListeners[activityType].push(listener);
            }
            var receivers = [];
            var r = this._receivers[activityType];
            for (var id in r)
                receivers.push(r[id]);
            listener(receivers);
        };

        this.removeReceiverListener = function addReceiverListener(activityType, listener) {
            var activityListeners = this._receiverListeners[activityType];
            if (activityListeners) {
                for (var i=0; i<activityListeners.length; ++i) {
                    if (activityListeners[i] === listener) {
                        if (activityListeners.length == 1) {
                            delete this._receiverListeners[activityType];
                        } else {
                            activityListeners.splice(i, 1);
                        }
                        return;
                    }
                }
            }
            Cast.error("Can't find listener in list");
        };

        this.launch = function launch(launchRequest, resultCallback) {
            if (!launchRequest || !launchRequest.activityType || !launchRequest.receiver) {
                Cast.error("Invalid launch request");
                return;
            }
            var data = { receiverId: launchRequest.receiver.id,
                         disconnectPolicy: launchRequest.disconnectPolicy,
                         type: "launch",
                         activityType: launchRequest.activityType };
            if (launchRequest.parameters) {
                if (typeof launchRequest.parameters === 'string') {
                    data.parameters = launchRequest.parameters;
                } else {
                    data.parameters = JSON.stringify(launchRequest.parameters);
                }
            }
            this._castInvoke("launch", data, resultCallback);
        };

        this.getActivityStatus = function getActivityStatus(activityId, resultCallback) {
            this._castInvoke("getActivityStatus", {activityId:activityId}, resultCallback);
        };

        this.stopActivity = function stopActivity(activityId, resultCallback) {
            this._castInvoke("stopActivity", {activityId:activityId}, resultCallback);
        };

        this.sendMessage = function sendMessage(activityId, namespace, message, resultCallback) {
            var data = { activityId:activityId, namespace:namespace };
            if (typeof message === 'string') {
                data.message = message;
            } else {
                data.message = JSON.stringify(message);
            }
            this._castInvoke("sendMessage", data, resultCallback);
        };

        this.addMessageListener = function addMessageListener(activityId, namespace, listener) {
            if (!this._messageListeners[activityId]) {
                this._messageListeners[activityId] = { namespace:[listener] };
            } else if (!this._messageListeners[activityId][namespace]) {
                this._messageListeners[activityId][namespace] = [listener];
            } else {
                this._messageListeners[activityId][namespace].push(listener);
            }
        };

        this.removeMessageListener = function removeMessageListener(activityId, namespace, listener) {
            var listeners = this._messageListeners[activityId];
            if (!listeners) {
                Cast.error("Unknown activity " + activityId);
                return;
            }

            var found = false;
            var nl = listeners[namespace];
            if (nl) {
                for (var i=0; i<nl.length; ++i) {
                    if (nl[i] === listener) {
                        nl.splice(i, 1);
                        found = true;
                        if (nl.length == 0) {
                            delete listeners[namespace];
                            break;
                        } else {
                            return;
                        }
                    }
                }
            }
            if (!found) {
                Cast.error("No such listener " + activityId + " " + namespace);
            } else {
                found = false;
                for (var key in listeners) {
                    found = true;
                    break;
                }
                if (!found) {
                    delete this._messageListeners[activityId];
                }
            }
        };

        // private:
        this._castInvoke = function _castInvoke(name, message, cb) {
            if (!message)
                message = {};
            message.idx = this._nextIdx++;
            this._cbs[message.idx] = cb;
            if (this._sendMessage)
                this._sendMessage(message);
            return message.idx;
        };
        this._receiveMessage = function _receiveSenderMessage(message) {
            switch (message.type) {
            case 'receiversChanged':
                // log(message.receivers);
                var changes = false;
                for (var activityType in message.receivers) {
                    var newReceivers = {};
                    var r = message.receivers[activityType];
                    var changed = !this._receivers[activityType] || r.length != this._receivers[activityType].length;
                    for (var i=0; i<r.length; ++i) {
                        newReceivers[r[i].id] = r[i];
                        if (!changed)
                            changed |= !this._receivers[activityType][r[i].id];
                    }
                    if (changed) {
                        changes = true;
                        this._receivers[activityType] = newReceivers;
                        var listeners = this._receiverListeners[activityType];
                        if (listeners) {
                            // log("Updating for", activityType);
                            for (var l=0; l<listeners.length; ++l) {
                                listeners[l](newReceivers);
                            }
                        // } else {
                        //     log("No listeners");
                        }
                    }
                }
                if (changes)
                    log("Receivers updated");
                break;
            case 'response':
                if (message.idx) {
                    var cb = this._cbs[message.idx];
                    delete this._cbs[message.idx];
                    if (cb)
                        cb(message.response);
                }
                break;
            }
        };

        this._receiverListeners = {};
        this._receivers = {};
        this._cbs = {};
        this._nextIdx = 1;
    },
    LaunchRequest: function LaunchRequest(activityType, receiver) {
        this.activityType = activityType;
        this.receiver = receiver;
        this.disconnectPolicy = "continue";
    },

    // private:
    errorFunction: undefined,
    error: function(args) {
        if (typeof this.errorFunction === 'function') {
            this.errorFunction(args);
        }
    }
};
