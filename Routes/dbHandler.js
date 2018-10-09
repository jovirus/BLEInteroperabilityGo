
module.exports = function(app, dbs) {

    app.get('/testcase', (req, res) => {
        console.log(`dbs contents ${dbs}`)
        dbs.collection('testcase').find().toArray((err, docs) => {
            if (err) throw err;
            console.log('Result found. See detail>')
            res.json(docs)
            dbs.close()
        })
      });

      app.get('/createDB', (req, res) => {
        dbs.createCollection("testNrf002", function(err, res) { 
            if (err) throw err;
            console.log("Collection created!");
        })
    })
    return app;
}