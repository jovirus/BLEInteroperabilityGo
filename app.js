/** File app.js is entry point of the application
 *  Usage: nrf devices interoperability test. No other purpose allowed.
 *  created by Jiajun Qiu @Nordic Semiconductor ASA 2018
 *  Email: jiajun.qiu@nordicsemi.no
 *  Lisence: GPL3.0
 *  See more detail on https://github.com/jovirus/ble-interoperabilityTest
 */

const express = require('express')
const https = require('https')
const http = require('http')
const fs = require('fs')
// const global = require('./global')
require('dotenv').config()


const app = express()

const initializeDatabases = require('./Database/dbConnnector')
const routes = require('./Routes/dbHandler') 

var privateKey  = fs.readFileSync('/usr/ssl/1564395_www.nrfipa.com.key', 'utf8');
var certificate = fs.readFileSync('/usr/ssl/1564395_www.nrfipa.com.pem', 'utf8');

var credentials = {key: privateKey, cert: certificate};

const port = process.env.HTTPS_PORT || 443

// initializeDatabases.open().then(dbs => { 
//     routes(app, dbs).listen(port, () => console.log(`listening on port ${port}`))
// })

initializeDatabases.open().then(dbs => { 
    routes(app, dbs).listen(port, () => {
        // const httpServer = http.createServer(this)
        var httpsServer = https.createServer(credentials, app);
        console.log(`listening on port ${port} with crt. ${credentials}`)
        return httpsServer.listen.apply(httpsServer)
    })
})