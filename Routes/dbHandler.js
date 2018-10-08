module.exports = function(app, dbs) {

    app.get('/testcase', (req, res) => {
        dbs.production.collection('testcase').find({}).toArray((err, docs) => {
          if (err) {
            console.log(err)
            res.error(err)
          } else {
            console.log('Result found. See detail> /n')
            res.json(docs)
          }
        })
      })

}