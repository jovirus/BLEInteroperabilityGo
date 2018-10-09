const MongoClient = require('mongodb').MongoClient

// Note: A production application should not expose database credentials in plain text.
// For strategies on handling credentials, visit 12factor: https://12factor.net/config.
const PROD_URI = "mongodb://root:Nordic@dds-n9eafa9e8c2661841.mongodb.rds.aliyuncs.com:3717"


function connect(url) {
    MongoClient.connect(PROD_URI, {useNewUrlParser: true}).then(client => {
        console.log("Database instance is conntected.");
        let db = client.db('tesNrf');
        db.collection('testcase').find().toArray(function(err, result){
            if(err) throw err;
            console.log(result);
            client.close();
          });
    }).catch((err) => {
        console.log(`Database connection faild.${err.log}`)
    })
    // return MongoClient.connect(url).then(client => {
    //     client.db()
    //     console.log("Database instance is conntected.")
    // }).catch((err) => {
    //         console.log(`Database connection faild.${err.log}`)
    //     })
}

module.exports = async function() {
    let databases = await Promise.all([connect(PROD_URI)]).catch(() => {})
    // let databases = new Promise(connect(PROD_URI)).catch(() => {})
    return {
      production: databases[0]
    }
}