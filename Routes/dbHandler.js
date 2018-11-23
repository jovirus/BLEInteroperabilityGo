const Joi = require("joi")
const express = require("express")
const DATABASE_NAME = "interoperaNrf"


const wxAppID = "wx34660eb5736f3524"
const wxAppSecret = "eacb31fdc1ce9359265135e62fb5e4b3"

module.exports = function(app, dbs) {
    app.use(express.json());

    app.post('/api/wechat/code2session', (req, res) => {
        const inqueries = { wxtoken } = req.query
        https.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${wxAppID}&secret=${wxAppSecret}&js_code=${wxtoken}&grant_type=authorization_code`, (resp) => {
        let data = ''
        resp.on('data', (chunk) => {
            data += chunk;
            });
            // The whole response has been received. Print out the result.
            resp.on('end', () => {
            const edata = JSON.parse(data)
            console.log(edata);
            res.status(200).send(edata)
            });
        }).on("error", (err) => {
            console.log("Error when fetching session info from wechat server: " + err.message)
            res.status(400).send(err)
          });
      });
      
      app.get('/api/find/mobileinfo', (req, res) => {
	    const inqueries = { brand, model, platform } = req.query
        let db = dbs.db(DATABASE_NAME)
        var query = {
            brand: brand,
            model: model,
            platform: platform
        }
        db.collection('MobileInfo').findOne(query, (err, docs) => {
            if (err) return res.status(400).send(err)
            res.status(200).send(docs)
        })
      });

      app.get('/api/find/testerinfo', (req, res) => {
        const inqueries = { nickName, gender, language, city, province, country, avatarUrl } = req.query
        let db = dbs.db(DATABASE_NAME)
        var query = {
            nickName: nickName,
            gender: gender,
            language: language,
            city: city,
            province: province,
            country: country,
            avatarUrl: avatarUrl
        };
        db.collection('TesterInfo').findOne(query, (err, docs) => {
            if (err) return res.status(400).send(err)
            res.status(200).send(docs)
        })
      });

      app.get('/api/find/testerinfo/:unionid', (req, res) => {
        let id = req.params.unionid
        let db = dbs.db(DATABASE_NAME);
        var query = {
            unionID: id 
        };
        db.collection('TesterInfo').findOne(query, (err, docs) => {
            if (err) return res.status(400).send(err)
            res.status(200).send(docs)
        })
      });

      app.get('/api/find/testreport/:mobileinfoid', (req, res) => {
        let id = req.params.mobileinfoid;
        let db = dbs.db(DATABASE_NAME);
        var query = {
            mobileInfoID: id 
        };
        db.collection('TestReport').find(query).toArray((err, docs) => {
            if (err) return res.status(400).send(err)
            res.status(200).send(docs)
        })
      });

      // Only open at test session
      app.get('/api/find/testcases/:sessionid', (req, res) => {
        let id = req.params.sessionid;
        console.log(`Requested sessionid is ${id}`)
        let db = dbs.db(DATABASE_NAME);
        var query = {
            sessionID: id 
        };
        db.collection('TestCases').find(query).toArray((err, docs) => {
            if (err) return res.status(400).send(err)
            res.status(200).send(docs)
        })
      });

      // download ssl cert.
      app.get('/.well-known/acme-challenge/vBOAFRg9QICgJeYDTrVO7qIpcSTx_pcmTAgsdozJ1l0', (req, res) => {
        res.status(200).sendFile('/usr/local/ble-interoperabilityTest/.well-known/acme-challenge/vBOAFRg9QICgJeYDTrVO7qIpcSTx_pcmTAgsdozJ1l0', {root: __dirname})
      });

      // this request exclusive mobileinfo, testerinfo, peripehralinfo
      app.post('/api/insert/testreport', (req, res) => {
        let report = req.body
        const { error } = validateTestReport(report)
        if (error) return res.status(400).send(error.details[0].message)
        let db = dbs.db(DATABASE_NAME)
        let result = db.collection("TestReport").insertOne(report, function(err, object){
            if (err) return res.status(400).send(err)
            res.status(200).send(object.insertedId) 
        }) 
      });

      // this request include mobileinfo, testerinfo, peripehralinfo with no validator
      app.post('/api/insert/testcases', (req, res) => {
        let report = req.body
        let db = dbs.db(DATABASE_NAME)
        let result = db.collection("TestCases").insertOne(report, function(err, object){
            if (err) return res.status(400).send(err)
            res.status(200).send(object.insertedId) 
        }) 
      });

      app.post('/api/insert/mobileinfo', (req, res) => {
        let mobileinfo = req.body
        const { error } = validateMobileInfo(mobileinfo)
        if (error) return res.status(400).send(error.details[0].message)
        let db = dbs.db(DATABASE_NAME)
        db.collection("MobileInfo").insertOne(mobileinfo, function(err, object){
            if (err) return res.status(400).send(err)
            res.status(200).send(object.insertedId)
        }) 
      });

      app.post('/api/insert/testerinfo', (req, res) => {
        let testerinfo = req.body
        const { error } = validateTesterInfo(testerinfo)
        if (error) return res.status(400).send(error.details[0].message)
        let db = dbs.db(DATABASE_NAME)
        db.collection("TesterInfo").insertOne(testerinfo, function(err, object){
            if (err) return res.status(400).send(err)
            res.status(200).send(object.insertedId)
        }) 
      });
      
      app.get('/api/initialize', (req, res) => {
        let db = dbs.db(DATABASE_NAME);
        let resultTestReportdb = db.createCollection("TestReport", {autoIndexId:true}, function(err1, collection1) {
            if (err1) return res.status(400).send(err1)
            let resultMobileInfodb = db.createCollection("MobileInfo", {autoIndexId:true}, function(err2, collection2) {
                if (err2) return res.status(400).send(err2)
                let resultTestInfodb = db.createCollection("TesterInfo", (err3, collection3) => {
                    if (err3) return res.status(400).send(err3) 
                    let resultTestCasesdb = db.createCollection("TestCases", (err4, collection4) => {
                        if (err4) return res.status(400).send(err4)
                        return res.status(200).send(`initial succeed with TestReportDB: ${collection1} and MobileInfoDB: ${collection2} and TesterInfo${collection3} and TestCases: ${collection4}`)
                })
            })
            })
        })
    });

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
            testerInfoID: Joi.string().allow(null),
            peripheralInfoID: Joi.string().allow(null),
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
            nickName: Joi.string().allow(''),
            gender: Joi.number().optional(),
            language: Joi.string().allow(''),
            city: Joi.string().allow(''),
            province: Joi.string().allow(''),
            country: Joi.string().allow(''),
            avatarUrl: Joi.string().allow('').optional()
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
