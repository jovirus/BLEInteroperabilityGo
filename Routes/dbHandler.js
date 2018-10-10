const Joi = require("joi")
const express = require('express')
const DATABASE_NAME = "tesNrf"


module.exports = function(app, dbs) {
    app.use(express.json());

    app.get('/api/testcase', (req, res) => {
        console.log(`dbs contents ${dbs}`)
        let db = dbs.db(DATABASE_NAME);
        db.collection('testcase').find().toArray((err, docs) => {
            if (err) throw err;
            console.log('Result found. See detail>')
            res.json(docs)
            // dbs.close()
        })
      });

      app.post('/api/testcase', (req, res) => {
        const schema = { 
            brand: Joi.string().min(2).required()
        }
        const { error } = Joi.validate(req.body, schema)
        if (!error) return res.status(400).send(error.detail[0].message)

        const testcase = {
            brand: req.body.brand
        }

         res.send(testcase) 
      });

      app.get('/createDB', (req, res) => {
        let db = dbs.db(DATABASE_NAME);
        db.createCollection("testNrf002", function(err, res) { 
            if (err) throw err;
            console.log("Collection created!");
        })
    })
    return app;
}