/** File global.js provide accessable variable for all files
 *  Usage: nrf devices interoperability test. No other purpose allowed.
 *  created by Jiajun Qiu @Nordic Semiconductor ASA 2018
 *  Email: jiajun.qiu@nordicsemi.no
 *  Lisence: GPL3.0
 *  See more detail on https://github.com/jovirus/ble-interoperabilityTest
 */

var fs = require('fs');
var PRODUCTION_DB_URL = ""

function readConfig() {
    fs.readFile('config.json', (err, data) => {  
        if (err) throw err
        let config = JSON.parse(data)
        this.PRODUCTION_DB_URL = config.database.connectionStringURI
        console.log(this.PRODUCTION_DB_URL)
    })
}

let global = {
    readConfig : readConfig
}

module.exports = global;