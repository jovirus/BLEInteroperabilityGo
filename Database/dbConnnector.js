/** File dbConnection is file is used to connect DB.
 *  Usage: nrf devices interoperability test. No other purpose allowed.
 *  created by Jiajun Qiu @Nordic Semiconductor ASA 2018
 *  Email: jiajun.qiu@nordicsemi.no
 *  Lisence: GPL3.0
 *  See more detail on https://github.com/jovirus/ble-interoperabilityTest
 */

const MongoClient = require('mongodb').MongoClient

// Note: A production application should not expose database credentials in plain text.
// For strategies on handling credentials, visit 12factor: https://12factor.net/config.
const PROD_URI = process.env.DB_CONNECTION_URL



function open() {
    return new Promise((resolve, reject) => {
        MongoClient.connect(PROD_URI, {useNewUrlParser: true}).then(client => {
            console.log("Succeed connect to database instance.")
              resolve(client)
        }).catch(function (err) {
            reject(err)
            console.log(`Failed connect to database.${err}`)
        })
    })
}

function close(db){
    if(db) { db.close() }
}

let db = {
    open : open,
    close: close
}

module.exports = db;