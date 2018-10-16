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
        })
      });

      app.get('/api/find/mobileinfo', (req, res) => {
	    const inqueries = { brand, model, platform } = req.query
        let db = dbs.db(DATABASE_NAME)
        var query = {
            brand: brand,
            model: model,
            platform: platform
        }
        db.collection('MobileInfo').findOne(query).toArray((err, docs) => {
            if (err) return res.status(400).send(docs)
            res.send(docs)
        })
      });

      app.get('/api/find/testerinfo/:unionid', (req, res) => {
        let id = req.params.unionid
        let db = dbs.db(DATABASE_NAME);
        var query = {
            unionID: id 
        };
        db.collection('TesterInfo').findOne(query).toArray((err, docs) => {
            if (err) throw err
            res.send(docs)
        })
      });


      app.post('/api/insert/testreport', (req, res) => {
        let report = req.body
        const { error } = validateTestReport(report)
        if (error) return res.status(400).send(error.details[0].message)
        let db = dbs.db(DATABASE_NAME)
        let result = db.collection("TestReport").insertOne(report, function(err, object){
            if (err) return res.send(err)
            res.send(object.insertedId) 
        }) 
      });

      app.post('/api/insert/mobileinfo', (req, res) => {
        let mobileinfo = req.body
        const { error } = validateMobileInfo(mobileinfo)
        if (error) return res.status(400).send(error.details[0].message)
        let db = dbs.db(DATABASE_NAME)
        db.collection("MobileInfo").insertOne(mobileinfo, function(err, object){
            if (err) return res.send(err)
            res.send(object.insertedId)
        }) 
      });

      app.post('/api/insert/testerinfo', (req, res) => {
        let testerinfo = req.body
        const { error } = validateTesterInfo(testerinfo)
        if (error) return res.status(400).send(error.details[0].message)
        let db = dbs.db(DATABASE_NAME)
        db.collection("TesterInfo").insertOne(testerinfo, function(err, object){
            if (err) return res.send(err)
            res.send(object.insertedId)
        }) 
      });

      app.get('/api/initialize', (req, res) => {
        let db = dbs.db(DATABASE_NAME);
        let resultTestReportdb = db.createCollection("TestReport", {autoIndexId:true}, function(err1, collection1) {
            if (err1) return res.send(err1)
            let resultMobileInfodb = db.createCollection("MobileInfo", {autoIndexId:true}, function(err2, collection2) {
                if (err2) return res.send(err2)
                let resultTestInfodb = db.createCollection("TesterInfo", (err3, collection3) => {
                    if (err3) return res.send(err3)
                    return res.send(`initial succeed with TestReportDB: ${collection1} and MobileInfoDB: ${collection2} and TesterInfo${collection3}`)
                })
            })
        })
    })

    function validateBrandName(value){
        const schema = { 
            brand: Joi.string().min(2).required()
        }
        return Joi.validate(value, schema)
    }
    
    function validateTestReport(value) {
        const schema = {
            sessionID: Joi.string().required(),
            weChatVersion: Joi.string().required(),
            sdkVersion: Joi.string().required(),
            timeStamp: Joi.date().required(),
            testType: Joi.string().required(),
            mobileInfoID: Joi.string().required(),
            peripheralInfoID: Joi.string(),
            isPassed: Joi.boolean().required()
        }
        return Joi.validate(value, schema)
    }
    
    function validateMobileInfo(value) {
        const schema = {
            brand: Joi.string().required(),
            model: Joi.string().required(),
            platform: Joi.string().required()
        }
        return Joi.validate(value, schema)
    }
    
    function validateTesterInfo(value) {
        const schema = {
            unionID: Joi.string().required(),
            nickName: Joi.string(),
            city: Joi.string(),
            province: Joi.string(),
            contry: Joi.string(),
            language: Joi.string()
        }
        return Joi.validate(value, schema)
    }
    
    function validatePeripheralInfo(value) {
        const schema = {
            chipset: Joi.string().required(),
            softdevice: Joi.string().required(),
            application: Joi.string(),
            bootloader: Joi.string()
        }
        return Joi.validate(value, schema)
    } 
    
    return app;
}
