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
const routes = require('./Routes/routerHandler')

var privateKey  = fs.readFileSync('/usr/ssl/2239387_www.nrfapaccloud.com.key');
var certificate = fs.readFileSync('/usr/ssl/2239387_www.nrfapaccloud.com.pem');

var credentials = {key: privateKey, cert: certificate};

// const port = process.env.HTTPS_PORT || 443
// const port = process.env.HTTP_PORT || 80


// initializeDatabases.open().then(dbs => { 
//     routes(app, dbs).listen(port, () => console.log(`listening on port ${port}`))
// })

// const httpsServer = https.createServer(credentials, (req, res) => {
//     res.writeHead(200); 
//     res.end("hello world\n"); 
// }).listen(port)


initializeDatabases.open().then(dbs => { 
    routes(app, dbs).listen(() => {
        const httpServer = http.createServer(app).listen(80)
        const httpsServer = https.createServer(credentials, app).listen(443)
        // console.log(`listening on port ${port}`)
        // httpsServer.listen.apply(httpsServer)
    })
})

// const httpServer = http.createServer(app).listen(80)
// const httpsServer = https.createServer(credentials, app).listen(process.env.HTTPS_PORT)