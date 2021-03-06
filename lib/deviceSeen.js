const rp = require('request-promise');
const config = require('../config.js');
const emojiStrip = require('emoji-strip')

module.exports = function deviceSeen(peripheral) {

    // if the bluetooth device does not have a name, 
    // don't handle it
    if(!peripheral.advertisement.localName) {
        return ;
    }
    
    var device = {
        name: emojiStrip(peripheral.advertisement.localName),
        protocol: 'bluetooth',
        service: 'bluetooth'
    };
    
    if(peripheral.address && peripheral.address !== 'unknown'){
        device.identifier = peripheral.address;
    } else {
        device.identifier = peripheral.id;
    }

    console.log(`Found Bluetooth peripheral, name = ${device.name}, id = ${peripheral.id}, address = ${peripheral.address}.`);

    var types = [
        {
            type: 'multilevel',
            name: 'rssi',
            identifier: 'rssi',
            units: 'dBm',
            sensor: true,
            min: -9999,
            max: 9999
        }
    ];

    var options = {
        method: 'POST',
        uri: config.gladysUrl + '/device?token=' + config.token,
        body: {device, types},
        json: true
    };

    return rp(options)
        .then((parsedResult) => {
            console.log(`Device "${parsedResult.device.name}" and DeviceState inserted with success !`);

            // if device has a owner, it means that user should be marked as seen in house 
            if(parsedResult.device && parsedResult.device.hasOwnProperty('user') && parsedResult.device.user != null) {

                console.log(`Device "${parsedResult.device.name}" is the peripheral of user ${parsedResult.device.user}, it means user is at home ID = ${config.gladysHouseId} ! `);
                
                var options = {
                    method: 'POST',
                    uri: `${config.gladysUrl}/user/${parsedResult.device.user}/house/${config.gladysHouseId}/seen?token=${config.token}`,
                    json: true
                };
    
                return rp(options);
            } else {
                return null;
            }
        })
        .catch((err) => {
            console.log('Error while sending data to Gladys');
            console.log(err);
            console.log(err.statusCode);
        }); 
};