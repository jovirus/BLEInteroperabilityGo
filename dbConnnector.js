const MongoClient = require('mongodb').MongoClient

// Note: A production application should not expose database credentials in plain text.
// For strategies on handling credentials, visit 12factor: https://12factor.net/config.
const PROD_URI = "mongodb://root:Nordic@dds-n9eafa9e8c2661841.mongodb.rds.aliyuncs.com:3717/admin"
const MKTG_URI = "mongodb://<dbuser>:<dbpassword>@<host1>:<port1>,<host2>:<port2>/<dbname>?replicaSet=<replicaSetName>"


MongoClient.connect(PROD_URI, {useNewUrlParser: true}).then(() => {
    if(!err) {
        console.log("We are connected");
      }
})