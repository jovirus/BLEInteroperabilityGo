const Joi = require("joi")
const express = require('express')
const DATABASE_NAME = "tesNrf"


module.exports = function(app, dbs) {
    app.use(express.json());

    app.get('/api/testcase', (req, res) => {
        let db = dbs.db(DATABASE_NAME);
        db.collection('testcase').find().toArray((err, docs) => {
            if (err) throw err
            res.json(docs)
            // dbs.close()
        })
      });

      app.post('/api/testcase', (req, res) => {
        const { error } = validateBrandName(req.body)
        if (error) return res.status(400).send(error.details[0].message)
        const testcase = {
            brand: req.body.brand
        }

         res.send(testcase) 
      });

      app.put('/api/testcase/:brand', (req, res) => {
        let vari = req.params.brand
        let body = req.body
        const { error } = validateBrandName(body)
        console.log(vari)
        console.log(body)
        if (error) return res.status(400).send(error.details[0].message)

        let db = dbs.db(DATABASE_NAME);
        const query = {
            brand: String(vari)
        }
        const testcase = db.collection('testcase').find({query}).toArray((err, docs) => {
            if (err) throw err
            res.send(docs)
        })
      });

      app.get('/createDB', (req, res) => {
        let db = dbs.db(DATABASE_NAME);
        db.createCollection("testNrf002", function(err, res) { 
            if (err) throw err;
            console.log("Collection created!");
        })
    })

    function validateBrandName(testcase){
        const schema = { 
            brand: Joi.string().min(2).required()
        }
        return Joi.validate(testcase, schema)
    }
    return app;
}