var serial = {
    connectionId: -1,
    
    transmitting: false,
    output_buffer: [],
    
    connect: function(path, options, callback) {
        var self = this;
        
        chrome.serial.connect(path, options, function(connectionInfo) {
            self.connectionId = connectionInfo.connectionId;
            
            if (connectionInfo.connectionId > 0) {
                console.log('SERIAL: Connection opened with ID: ' + connectionInfo.connectionId + ', Baud: ' + connectionInfo.bitrate);
            }
            
            callback(connectionInfo);
        });
    },
    disconnect: function(callback) {
        var self = this;
        
        self.empty_output_buffer();
        
        chrome.serial.disconnect(this.connectionId, function(result) {
            if (result) {
                console.log('SERIAL: Connection with ID: ' + self.connectionId + ' closed');
            } else {
                console.log('SERIAL: Failed to close connection with ID: ' + self.connectionId + ' closed');
            }
            
            self.connectionId = -1;
            
            callback(result);
        });
    },
    getDevices: function(callback) {
        chrome.serial.getDevices(function(devices_array) {
            var devices = [];
            devices_array.forEach(function(device) {
                devices.push(device.path);
            });
            
            callback(devices);
        });
    },
    setControlSignals: function(signals, callback) {
        chrome.serial.setControlSignals(this.connectionId, signals, callback);
    },
    send: function(data, callback) {
        var self = this;
        self.output_buffer.push({'data': data, 'callback': callback});
        
        if (!self.transmitting) {
            self.transmitting = true;
            
            var sending = function() {
                // store inside separate variables in case array gets destroyed
                var data = self.output_buffer[0].data;
                var callback = self.output_buffer[0].callback;
                
                chrome.serial.send(self.connectionId, data, function(sendInfo) {
                    callback(sendInfo);
                    self.output_buffer.shift();
                    
                    if (self.output_buffer.length) {
                        // keep the buffer withing reasonable limits
                        while (self.output_buffer.length > 500) {
                            self.output_buffer.pop();
                        }
                        
                        sending();
                    } else {
                        self.transmitting = false;
                    }
                });
            };
            
            sending();
        }
    },
    onReceive: {
        listeners_: chrome.serial.onReceive.listeners_,
        
        addListener: function(function_reference) {
            chrome.serial.onReceive.addListener(function_reference);
        },
        removeListener: function(function_reference) {
            chrome.serial.onReceive.removeListener(function_reference);
        }
    },
    empty_output_buffer: function() {
        this.output_buffer = [];
        this.transmitting = false;
    }    
};