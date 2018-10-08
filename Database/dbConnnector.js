const MongoClient = require('mongodb').MongoClient

// Note: A production application should not expose database credentials in plain text.
// For strategies on handling credentials, visit 12factor: https://12factor.net/config.
const PROD_URI = "mongodb://root:Nordic@dds-n9eafa9e8c2661841.mongodb.rds.aliyuncs.com:3717/admin"


function connect(url) {
    MongoClient.connect(PROD_URI, {useNewUrlParser: true}).then(() => {
        console.log("Database instance is conntected.");
    }).catch((err) => {
        console.log(`Database connection faild.${err.log}`)
    })
}

module.exports = async function() {
    let databases = await Promise.all([connect(PROD_URI)]).catch(() => {})
    // let databases = new Promise(connect(PROD_URI)).catch(() => {})
   
    return {
      production: databases[0]
    }
}