
const MongoClient = require('mongodb').MongoClient

// Note: A production application should not expose database credentials in plain text.
// For strategies on handling credentials, visit 12factor: https://12factor.net/config.
const PROD_URI = "mongodb://root:Nordic@dds-n9eafa9e8c2661841.mongodb.rds.aliyuncs.com:3717"


function open() {
    return new Promise((resolve, reject) => {
        MongoClient.connect(PROD_URI, {useNewUrlParser: true}).then(client => {
            console.log("Succeed connect to database instance.")
              resolve(client)
        }).catch(function (err) {
            reject(err)
            console.log('Failed connect to database.')
        })
    })
}

function close(db){
    //Close connection
    if(db){
        db.close();
    }
}

let db = {
    open : open,
    close: close
}

module.exports = db;

// module.exports = async function() {
//     let databases = await Promise.all([connect(PROD_URI)]).catch(() => {})
//     // let databases = new Promise(connect(PROD_URI)).catch(() => {})
//     return {
//       production: databases[0]
//     }
// }