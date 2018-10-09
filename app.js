const express = require('express')
const app = express()

const initializeDatabases = require('./Database/dbConnnector')
const routes = require('./Routes/dbHandler') 

initializeDatabases().then(dbs => { 
    routes(app, dbs).listen(3000, () => console.log("listening on port 3000"))
})