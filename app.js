const express = require('express')
const app = express()

const initializeDatabases = require('./Database/dbConnnector')
const routes = require('./Routes/dbHandler') 

initializeDatabases(function(err, dbs) {
    if (err) {
        console.error(`Failed connect database. Detail: ${err}`)
        process.exit(1)
    }
    routes(app, dbs).listen(3000, function() {
        console.log('Listening on port 3000').catch(err => {})
      })
})