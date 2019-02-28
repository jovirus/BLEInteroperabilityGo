/** Provide Network handlers
 *  created by Jiajun Qiu @Nordic Semiconductor ASA 2018
 *  Email: jiajun.qiu@nordicsemi.no
 *  Lisence: GPL3.0
 *  See more detail on https://github.com/jovirus/ble-interoperabilityTest
 */

const https = require('https')

 function httpsRequest(url) {
     return new Promise((resolve, reject) => {
        https.get(url, (r) => {
            // console.log('statusCode:', r.statusCode);
            // console.log('headers:', r.headers);
            var body = ''
            r.on('data', (dataChunck) => {
                // var result = process.stdout.write(dataChunck);
                body += dataChunck
            });
            r.on('end', (end) => {
                resolve(body)
            })
          }).on('error', function(e) {
            console.log('ERROR: ' + e.message);
            reject(Error(e.message))
          });
     });
 } 

 let handlers = {
    httpsRequest: httpsRequest
}

module.exports = handlers;