/** File dbHandler.js is file is used to handel web requests.
 *  Usage: nrf devices interoperability test. No other purpose allowed.
 *  created by Jiajun Qiu @Nordic Semiconductor ASA 2018
 *  Email: jiajun.qiu@nordicsemi.no
 *  Lisence: GPL3.0
 *  See more detail on https://github.com/jovirus/ble-interoperabilityTest
 */

const userGroup = require("../DataModel/userGroupEnum")
const dataStorageService = require("./dataStorageService") 
const loginService = require("./loginService") 
const Joi = require("joi")
const https = require('https')
const express = require("express")
var path = require('path');
const url = require('url');  
const querystring = require('querystring');
var cookieParser = require('cookie-parser')



const MINIAPP_PROD_DATABASE_NAME = process.env.DATABASE_NAME
const TEST91_DATABASE_NAME = process.env.DB_91

module.exports = function(app, dbs) {
    app.use(express.json());
    app.use(cookieParser(process.env.COOKIE_SECRET));

       /**  Tencent Mini-app verfication file sUVEnOBdTo.txt.
        *   To satisfy Mini-app publish process, the web server shall able to retrieve the file
        *   The 16 bytes file is generated by Tencent, and placed in Mini-app server root
        */
      app.get('/sUVEnOBdTo.txt', (req, res) => {
        app.use(express.static('.crc'))
        var jsonPath = path.join(__dirname, '../.crc/sUVEnOBdTo.txt');
        res.status(200).sendFile(jsonPath)
      });

      /** Login oauth2 with WeChat
       *  Redirect URL
       */
      app.get('/oauth2.0/login', (req, res) => {
        loginService.getWxLoginQRCode().then((result) => {
            res.status(200).send(result)
        }).catch(function(error) {
            res.status(400).send("Error when contact WeChat server, Please try again later", error)
        })
      })

      app.get('/login/wx', (req, res) => {
        let wxCode = req.query.code
        loginService.getWxLoginToken(wxCode).then((result) => {
            var tokenInfo = JSON.parse(result)
            console.log(tokenInfo)
            loginService.getWxUserInfo(tokenInfo.access_token, tokenInfo.openid).then((userInfo) => {
                console.log(userInfo)
                dataStorageService.isUserExist(dbs, userInfo).then((resultInfo) => {
                    if (resultInfo === undefined) {
                        var nrfUser = dataStorageService.createNrfUser(userInfo, userGroup.UserGroupEnum.unauthorized)
                        console.log("The nRF User: ", nrfUser)
                        dataStorageService.saveNewUser(dbs, nrfUser).then((result) => {
                            res.send("Application has received. please contact admin to process.")
                        })
                    } else if (resultInfo.usergroup === userGroup.UserGroupEnum.unauthorized) {
                        res.send("Your application is pending. please contact admin to process.")
                    } else {
                        var hash = loginService.generateHash(tokenInfo.access_token)
                        res.cookie('t', hash, { httpOnly: true, signed: true, secure: true, maxAge: 60000 });
                        res.status.send("Welcome Jiajun")
                    }
                })
            }).catch(function(error) {
                res.status(400).send("Error fetching userinfo from WeChat server, Please try again later: ", error)
            })
        }).catch(function(error) {
            res.status(400).send("Error when authorizing with WeChat server, Please try again later: ", error)
        })
      });

      /** API documentation
       *  Present API for client use
       */
      app.get('/api/index.html', (req, res) => {
        var docPath = path.join(__dirname, '../index.html');
        console.log('Cookies: ', req.cookies)
        console.log('Signed Cookies: ', req.signedCookies)
        res.status(200).sendFile(docPath)
      });

      app.get('/api/doc/testcases.html', (req, res) => {
        var docPath = path.join(__dirname, '../doc/testcases.html');
        res.status(200).sendFile(docPath)
      });

    /**  INSERT TESTCASE
     *   Return insertedid
     */
      app.post('/api/miniapp/insert/report/', (req, res) => {
        let report = req.body
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME)
        let result = db.collection(process.env.DB_COLLECTION_TESTREPORT).insertOne(report, function(err, object){
            if (err) return res.status(400).send(err)
            res.status(200).send(object.insertedId) 
        }) 
      });

//     /**  GET ALL TEST REPORTS
//      *   Pop up all reports
//      */
//     app.get('/api/miniapp/find/report/', (req, res) => {
//         let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
//         var supressedValue = {
//             _id: 0,
//         }
//         db.collection(process.env.DB_COLLECTION_TESTREPORT).find({}).project(supressedValue).toArray((err, docs) => {
//             if (err) return res.status(400).send(err)
//                 const result = {
//                     matchedResults: docs.length,
//                     contents: docs
//                 }
//                 res.status(200).send(result)
//             })
//     });
 
//     /**  GET REPORT BY MOBILE BRAND
//      *   Return related reports by given specific brand name and OR return all reports by hitting the designated url
//      */
//    app.get('/api/miniapp/find/report/brand/', async (req, res) => {
//     let originalUrl = req.originalUrl
//     let field = "mobileInfo.brand"
//     let brand = req.query.pm
//     let db = dbs.db(MINIAPP_PROD_DATABASE_NAME)

//     if (originalUrl === '/api/miniapp/find/report/brand/') {
//         await db.collection(process.env.DB_COLLECTION_TESTREPORT).distinct(field, {}, (err, docs) => {
//             if (err) return res.status(400).send(err)
//                 const result = {
//                     matchedResults: docs.length,
//                     contents: docs
//                 }
//                 res.status(200).send(result)
//             })
//         return
//     }
//     if (brand === undefined || brand === "") {
//         return res.status(404).send("The requested URL was not found on this server.")
//     } 
//         var query = {
//             "mobileInfo.brand": brand 
//         }
//         var supressedValue = {
//             _id: 0,
//         }
//         db.collection(process.env.DB_COLLECTION_TESTREPORT).find(query).project(supressedValue).toArray((err, docs) => {
//             if (err) return res.status(400).send(err)
//                 const result = {
//                     matchedResults: docs.length,
//                     contents: docs
//                 }
//                 res.status(200).send(result)
//             })
//     });

//     /** GET ALL ANDROID DEVICE REPORT
//      *  Return all android device report
//      */
//    app.get('/api/miniapp/find/report/platform/android/', (req, res) => {
//     let platform = "android"
//     let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
//     var query = {
//         'mobileInfo.platform': platform 
//     };
//     var supressedValue = {
//         _id: 0,
//     }
//     db.collection(process.env.DB_COLLECTION_TESTREPORT).find({"mobileInfo.platform": "android" }).toArray((err, docs) => {
//         if (err) return res.status(400).send(err)
//             const result = {
//                 matchedResults: docs.length,
//                 contents: docs
//             }
//             res.status(200).send(result)
//         })
//     });

//     /** GET ALL IOS DEVICE REPORT 
//      *  Return all iOS device report
//      */
//    app.get('/api/miniapp/find/report/platform/ios/', (req, res) => {
//     let platform = "ios"
//     let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
//     var query = {
//         "mobileInfo.platform": platform 
//     };
//     var supressedValue = {
//         _id: 0,
//     }
//     db.collection(process.env.DB_COLLECTION_TESTREPORT).find(query).toArray((err, docs) => {
//         if (err) return res.status(400).send(err)
//             const result = {
//                 matchedResults: docs.length,
//                 contents: docs
//             }
//             res.status(200).send(result)
//         })
//     });

//     /** GET REPORT BY SESSIONID
//      *  Return report associated by the sessionid in json format
//      */
//    app.get('/api/miniapp/find/report/sessionid/', (req, res) => {
//         let id = req.query.pm
//         let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
//         if (id === undefined || id === "") {
//             return res.status(404).send("The requested URL was not found on this server.")
//         } 
//         var query = {
//             sessionID: id 
//         };
//         var supressedValue = {
//             _id: 0,
//         }
//         db.collection(process.env.DB_COLLECTION_TESTREPORT).find(query).project(supressedValue).toArray((err, docs) => {
//             if (err) return res.status(400).send(err)
//             res.status(200).send(docs)
//         })
//     });

    /* REQUEST SESSIONID FROM WECHAT
     *  The request shall include wxAppID, wxAppSecret, wxtoken as parameters
     *  The method return a encrypted data contains sensative information.
     *  see more on https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/code2Session.html
     */
    app.post('/api/wechat/code2session', (req, res) => {
        const inqueries = { wxtoken } = req.query
        https.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WX_APP_ID}&secret=${process.env.WX_APP_SECRET}&js_code=${wxtoken}&grant_type=authorization_code`, (resp) => {
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

    /* INITIALIZE DATABASE
     * The db shall only initialize once.
     *   Structure:
     *   --TestReport
     *   -----sessionID
     *   -----timeStamp
     *   -----userInfo
     *   -----------country
     *   -----mobileInfo
     *   -----------brand
     *   -----------model
     *   -----------platform
     *   -----------weChatVersion
     *   -----------sdkVersion
     *   -----mobileInfo*
     *   -----------sequenceNr
     *   -----------isPassed
     *   -----------additionalInfo1
     *   -----------additionalInfo2
     *   -----------testcaseID
     *   This method shall preventing malicious request.
     *   FOR NOW, ONLY TESTREPORT TABLE IS IN USE! MOBILEINFO, TESTINFO, PERIPHERALINFO(OPTION) IS INCLUDED IN THE TESTREPORT. 
     */
    app.get('/api/miniapp/initialize', (req, res) => {
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
        let collection = db.createCollection(process.env.DB_COLLECTION_TESTREPORT, (err, collection) => {
            if (err) return res.status(400).send(err)
            return res.status(200).send('succeed')
        })
    });

    app.get('/api/miniapp/initialize', (req, res) => {
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
        let collection = db.createCollection(process.env.DB_COLLECTION_TESTREPORT, (err, collection) => {
            if (err) return res.status(400).send(err)
            return res.status(200).send('succeed')
        })
    });

    /************************************************************************** NRF 91 **********************************************************************
     * *****************************************************************************************************************************************************/

    /** GET 91 SWITCH RESULT
     *  Required parameter board nr
     *  The method return the desired board switch status
     */
   app.get('/nrf91/test/find/:boardnr', (req, res) => {
    let board_nr = req.params.boardnr;
    let db = dbs.db(TEST91_DATABASE_NAME);
    var query = {
        boardNr: board_nr 
    };
    var supressedValue = {
        _id: 0,
        boardNr: 0
    }
    db.collection(process.env.DB_TEST_COLLECTION_NRF91).find(query).project(supressedValue).toArray((err, docs) => {
        if (err) return res.status(400).send(err)
        res.status(200).send(docs)
    })
   })

    /** Push DK(nRF91) swtich status
     *  Type: text/html: charset=utf-8
     *  required parameters:
     *  "/boardnr/switchnr/status"
     */  
    app.post('/nrf91/test/push/:boardnr/:status/:switchnr', (req, res) => {
    var board_nr = req.params.boardnr
    var status = req.params.status
    var switch_nr = req.params.switchnr
    let db = dbs.db(TEST91_DATABASE_NAME)
    var query = {
        boardNr: board_nr 
    };
    let newValue = {
        status: status,
        switchNr: switch_nr
    }
    db.collection(process.env.DB_TEST_COLLECTION_NRF91).findOneAndUpdate(query, {$set: newValue}, {upsert: true}, (err, docs) => {
        if (err) return res.status(400).send(err)
        res.status(200).send("succeed")
        })
    })

    /*
     * Initialize nRF91 demo test use database.
     * The db shall only initialize once.
     * structure:
     *  ---boardNr
     *  ---switchNr
     *  ---status
     */
    app.get('/nrf91/test/init', (req, res) => {
        let db = dbs.db(TEST91_DATABASE_NAME);
        let resultTestCasesdb = db.createCollection(process.env.DB_TEST_COLLECTION_NRF91, (err, collection) => {
            if (err) return res.status(400).send(err)
            return res.status(200).send('succeed')
        })
    })

    /**
     * RESPONSE TO UNUSED SERVICES
     */  
    app.use((req, res) => {
        res.clearCookie('nrfa1');
        res.send('***This is a private portal used for nrf devices interoperability test.\n ***Any unauthorized access will be blocked and shall leave this portal.');
    });

     /***************************************************************************************** NOT IN USED ***************************************************************************************************************
      * 
      * 
      * 
      * ********************************************************************************************************************************************************************************************************************/

      /* DOWNLOAD SSL CERT.
          cert. installed at /usr/local/ble-interoperabilityTest/.well-known/acme-challenge/
          credidential is generated by ./certbot-auto
          example command ./certbot-auto --manual
          see example on https://itnext.io/node-express-letsencrypt-generate-a-free-ssl-certificate-and-run-an-https-server-in-5-minutes-a730fbe528ca
       */
      app.get('/.well-known/acme-challenge/vAujwULlSAuA8Pnhfirjvd7HvAErIIE4keaMo7lxAqw', (req, res) => {
        app.use(express.static('.well-known/acme-challenge'))
        var jsonPath = path.join(__dirname, '../.well-known/acme-challenge/vAujwULlSAuA8Pnhfirjvd7HvAErIIE4keaMo7lxAqw');
        console.log(`json path ${jsonPath}`)
        res.status(200).sendFile(jsonPath)
      }); 
     
     app.post('/api/insert/testreport', (req, res) => {
        let report = req.body
        const { error } = validateTestReport(report)
        if (error) return res.status(400).send(error.details[0].message)
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME)
        let result = db.collection("TestReport").insertOne(report, function(err, object){
            if (err) return res.status(400).send(err)
            res.status(200).send(object.insertedId) 
        }) 
      }); 
     
     app.get('/api/find/mobileinfo', (req, res) => {
	    const inqueries = { brand, model, platform } = req.query
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME)
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
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME)
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
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
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
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
        var query = {
            mobileInfoID: id 
        };
        db.collection('TestReport').find(query).toArray((err, docs) => {
            if (err) return res.status(400).send(err)
            res.status(200).send(docs)
        })
      });

      app.post('/api/insert/mobileinfo', (req, res) => {
        let mobileinfo = req.body
        const { error } = validateMobileInfo(mobileinfo)
        if (error) return res.status(400).send(error.details[0].message)
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME)
        db.collection("MobileInfo").insertOne(mobileinfo, function(err, object){
            if (err) return res.status(400).send(err)
            res.status(200).send(object.insertedId)
        }) 
      });

      app.post('/api/insert/testerinfo', (req, res) => {
        let testerinfo = req.body
        const { error } = validateTesterInfo(testerinfo)
        if (error) return res.status(400).send(error.details[0].message)
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME)
        db.collection("TesterInfo").insertOne(testerinfo, function(err, object){
            if (err) return res.status(400).send(err)
            res.status(200).send(object.insertedId)
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
