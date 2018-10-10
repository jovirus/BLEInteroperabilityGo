const express = require('express')
const app = express()

const initializeDatabases = require('./Database/dbConnnector')
const routes = require('./Routes/dbHandler') 

const port = process.env.PORT || 3000

initializeDatabases.open().then(dbs => { 
    routes(app, dbs).listen(port, () => console.log(`listening on port ${port}`))
})