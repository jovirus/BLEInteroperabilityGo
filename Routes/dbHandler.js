module.exports = function(app, dbs) {

    app.get('/testcase', (req, res) => {
        var dbo = dbs.db('testNrf')
        dbo.production.collection('testcase').find({}).toArray((err, docs) => {
          if (err) {
            console.log(err)
            res.error(err)
          } else {
            console.log('Result found. See detail> /n')
            res.json(docs)
          }
        })
      })
    return app;
}