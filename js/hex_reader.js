// input = string
// result = if hex file is valid, result is an object
//          if hex file wasn't valid (crc check failed on any of the lines), result will be false
function read_hex_file(data) {
    data = data.split("\n");
    
    // check if there is an empty line in the end of hex file, if there is, remove it
    if (data[data.length - 1] == "") {
        data.pop();
    }
    
    var hexfile_valid = true; // if any of the crc checks failed, this variable flips to false
    
    var result = {
        data:                       [],
        end_of_file:                false,
        extended_linear_address:    0,
        start_linear_address:       0,
        bytes:                      0
    };
    
    for (var i = 0; i < data.length; i++) {
        var byte_count = parseInt(data[i].substr(1, 2), 16) * 2; // each byte is represnted by two chars (* 2 to get the hex representation)
        var address = data[i].substr(3, 4);
        var record_type = parseInt(data[i].substr(7, 2), 16); // also converting from hex to decimal
        var content = data[i].substr(9, byte_count);
        var checksum = parseInt(data[i].substr(9 + byte_count, 2), 16); // also converting from hex to decimal (this is a 2's complement value)
       
        switch (record_type) {
            case 0x00: // data record
                if (byte_count > 0) {
                    var crc = (byte_count / 2) + parseInt(address.substr(0, 2), 16) + parseInt(address.substr(2, 2), 16) + record_type;
                    for (var needle = 0; needle < byte_count; needle += 2) {
                        var num = parseInt(content.substr(needle, 2), 16); // get one byte in hex and convert it to decimal
                        result.data.push(num);
                        
                        crc += num;
                        result.bytes++;
                    }
                    
                    // change crc to 2's complement (same as checksum)
                    crc = ~crc + 1;
                    crc &= 0xFF;
                    
                    // verify 
                    if (crc != checksum) {
                        hexfile_valid = false;
                        
                        // break out of the for loop as crc is wrong anyway, we dont need to process any more data
                        i = data.length;
                    }
                }
                break;
            case 0x01: // end of file record
                result.end_of_file = true;
                break;
            case 0x02: // extended segment address record
                // not implemented
                break;
            case 0x03: // start segment address record
                // not implemented
                break;
            case 0x04: // extended linear address record                
                result.extended_linear_address = (parseInt(content.substr(0, 2), 16) << 24) | parseInt(content.substr(2, 2), 16) << 16;
                break;
            case 0x05: // start linear address record
                result.start_linear_address = (parseInt(content.substr(0, 2), 16) << 24) | (parseInt(content.substr(2, 2), 16) << 16) | (parseInt(content.substr(4, 2), 16) << 8) | parseInt(content.substr(6, 2), 16);
                break;
        }
    }
    
    if (hexfile_valid) {
        if (debug) console.log('HEX file parsed: ' + result.bytes + ' bytes');
        
        return result;
    } else {
        if (debug) console.log('HEX file parsed, CRC check failed: ' + result.bytes + ' bytes');
        command_log('HEX file CRC check failed, file appears to be corrupted, we recommend to re-install the application'); 
        
        return false;
    }
}