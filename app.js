const express = require('express')
// const https = require('https')
var fs = require('fs');

const app = express()

const initializeDatabases = require('./Database/dbConnnector')
const routes = require('./Routes/dbHandler') 
// var credentials = {key: privateKey, cert: certificate};
// var httpsServer = https.createServer(credentials, app);

// var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
// var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

const port = process.env.PORT || 80

initializeDatabases.open().then(dbs => { 
    routes(app, dbs).listen(port, () => console.log(`listening on port ${port}`))
})