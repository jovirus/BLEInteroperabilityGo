/** File app.js is entry point of the application
 *  Usage: nrf devices interoperability test. No other purpose allowed.
 *  created by Jiajun Qiu @Nordic Semiconductor ASA 2018
 *  Email: jiajun.qiu@nordicsemi.no
 *  Lisence: GPL3.0
 *  See more detail on https://github.com/jovirus/ble-interoperabilityTest
 */

const express = require('express')
// const https = require('https')
const http = require('http')
// const global = require('./global')
require('dotenv').config()


const app = express()

const initializeDatabases = require('./Database/dbConnnector')
const routes = require('./Routes/dbHandler') 
// var credentials = {key: privateKey, cert: certificate};
// var httpsServer = https.createServer(credentials, app);

// var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
// var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

const port = process.env.PORT || 80

// initializeDatabases.open().then(dbs => { 
//     routes(app, dbs).listen(port, () => console.log(`listening on port ${port}`))
// })

// initializeDatabases.open().then(dbs => { 
//     routes(app, dbs).listen(port, () => {
//         const httpServer = http.createServer(this)
//         return httpServer.listen.apply(httpServer)
//         console.log(`listening on port ${port}`)
//     })
// })

console.log(`ennnnnnnvvvv : ${process.env.DB_CONNECTION_URL}`)