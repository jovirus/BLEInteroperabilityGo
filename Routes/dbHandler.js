module.exports = function(app, dbs) {

    app.get('/testcase', (req, res) => {
        dbo.tesNrf.collection('testcase').find({}).toArray((err, docs) => {
          if (err) {
            console.log(err)
            res.error(err)
          } else {
            console.log('Result found. See detail> /n')
            res.json(docs)
          }
        })
      });

      app.get('/createDB', (req, res) => {
      dbo.createCollection("testNrf002", function(err, res) { 
        if (err) throw err;
        console.log("Collection created!");
      })
    })
    return app;
}