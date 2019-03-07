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
const SEESION_EXPIRE = 7200000 // use wechat limit time for token without refresh 2h
const OWN_DOMAIN = "https://nrfipa.com/" 

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

    //Index page of the domain
    app.get('/index', (req, res) => {
        var docPath = path.join(__dirname, "../frontpage.html")
        return res.status(200).sendFile(docPath)
    });

    /** Login oauth2 with WeChat
     *  Redirect URL
     */
    app.get('/oauth2.0/login', (req, res) => {
        if (req.signedCookies.t !== undefined) {
            var allowedUserGroup = [userGroup.UserGroupEnum.admin, userGroup.UserGroupEnum.developer, userGroup.UserGroupEnum.sales, userGroup.UserGroupEnum.marketing]
            loginService.verifyCookie(dbs,req.signedCookies.t, allowedUserGroup).then((userCookie) => { 
                if (userCookie.length === 0) {
                    return wxLogin(req, res)
                } else if (userCookie.length === 1) {
                    return res.redirect(`/ui/index.html?user=${userCookie[0].nickname}`)
                } else {
                    return res.status(409).send("Access denied.")
                }
            }).catch(function(error) {
                return res.status(500).send("Internal Error", error)
            })
        } else {
            wxLogin(req, res)
        }
      })

    app.get('/login/wx', (req, res) => {
        let wxCode = req.query.code
        loginService.getWxLoginToken(wxCode).then((result) => {
            var tokenInfo = JSON.parse(result)
            loginService.getWxUserInfo(tokenInfo.access_token, tokenInfo.openid).then((userInfo) => {
                dataStorageService.isUserExist(dbs, tokenInfo.openid).then((resultInfo) => {
                    if (resultInfo.length === 0) {
                        var nrfUser = dataStorageService.createNrfUser(userInfo, userGroup.UserGroupEnum.unauthorized)
                        dataStorageService.saveNewUser(dbs, nrfUser).then((result) => {
                            if (result) return res.send(`Application has received. please contact admin with the receipt number: ${nrfUser.ref}`)
                        }).catch(function(error) {
                            return res.status(500).send("Error when register new user, Please try again later: ", error)
                          });
                    } else if (resultInfo[0].usergroup === userGroup.UserGroupEnum.unauthorized) {
                        return res.send("You don't have the right to access the portal. please contact admin to process.")
                    } else {
                        var hash = loginService.generateHash(tokenInfo.access_token)
                        var expireIn = loginService.getExpireTime(7200000) // match the wechat token expire Time
                        dataStorageService.saveCookie(dbs, hash, tokenInfo.access_token, tokenInfo.openid, new Date(expireIn)).catch(function(error) {
                            return res.status(500).send("Internal Error: ", error)
                          });
                        res.cookie('t', hash, { httpOnly: true, signed: true, secure: true, maxAge: 7200000 });
                        return res.redirect(`/ui/index.html?user=${userInfo.nickname}`);
                    }
                }).catch(function(error) {
                    return res.status(500).send("Error when fetch login history from server, Please try again later: ", error)
                  });
            }).catch(function(error) {
                return res.status(500).send("Error fetching userinfo from WeChat server, Please try again later: ", error)
            })
        }).catch(function(error) {
            return res.status(500).send("Error when authorizing with WeChat server, Please try again later: ", error)
        })
    });

    function wxLogin(req, res) {
        loginService.getWxLoginQRCode().then((result) => {
            return res.status(200).send(result)
        }).catch(function(error) {
            return res.status(400).send("Error when contact WeChat server, Please try again later", error)
        })
      }

    app.get('/logoff', (req, res) => {
        if (req.signedCookies.t !== undefined) { 
            loginService.setCookieToExpire(dbs, req.signedCookies.t).then((result) => { 
                if (result) return res.status(200).send("Logged out")
                else return res.redirect(OWN_DOMAIN)
            }).catch(function(error) {
                return res.status(503).send("Internal Error", error)
            })
        } else {
            return res.redirect(OWN_DOMAIN)
        }
    });

    app.all('/admin/*', function (req, res, next) { 
        if (req.signedCookies.t !== undefined) { 
            var allowedUserGroup = [userGroup.UserGroupEnum.admin]
            loginService.verifyCookie(dbs,req.signedCookies.t, allowedUserGroup).then((userCookie) => { 
                if (userCookie.length === 0) {
                    var docPath = path.join(__dirname, '../doc/refuse.html')
                    return res.status(200).sendFile(docPath)
                } else if (userCookie.length === 1) {
                    next() // pass control to the next handler
                } else {
                    return res.status(409).send("Multipule login detected.")
                }
            }).catch(function(error) {
                return res.status(503).send("Internal Error", error)
            })            
        } else {
            return res.redirect(OWN_DOMAIN)
        }
    })

    app.get('/admin/manage', (req, res) => {
        var docPath = path.join(__dirname, '../webform/authorizeuser.html')
        return res.status(200).sendFile(docPath)
    })

    app.get('/admin/manage/unauthorized', (req, res) => {
        dataStorageService.getAllUnauthorizedUser(dbs).then((unauthorizedUsers) => {
            const result = {
                matchedResults: unauthorizedUsers.length,
                contents: unauthorizedUsers
            }
            res.status(200).send(result)
        }).catch(function(error) {
            return res.status(503).send("Internal Error", error)
        })
    });

    app.get('/admin/manage/authorize', (req, res) => {
        let ref = req.query.ref
        let group = parseInt(req.query.group)
        dataStorageService.authorizeAUser(dbs, ref, group).then((result) => {
            if (result) return res.status(200).send("succeed")
            else return res.status(200).send("Faild, please try again")
        }).catch(function(error) {
            return res.status(503).send("Internal Error", error)
        })
    })

/******************************************************** UI interface ****************************************************/

    app.all('/ui/*', function (req, res, next) {
        if (req.signedCookies.t !== undefined) { 
            var allowedUserGroup = [userGroup.UserGroupEnum.admin, userGroup.UserGroupEnum.sales, userGroup.UserGroupEnum.marketing]
            loginService.verifyCookie(dbs,req.signedCookies.t, allowedUserGroup).then((userCookie) => { 
                if (userCookie.length === 0) {
                    var docPath = path.join(__dirname, '../doc/refuse.html')
                    return res.status(200).sendFile(docPath)
                } else if (userCookie.length === 1) {
                    next() // pass control to the next handler
                } else {
                    return res.status(409).send("Multipule login detected.")
                }
            }).catch(function(error) {
                return res.status(503).send("Internal Error", error)
            })
        } else {
            return res.redirect(OWN_DOMAIN)
        }
    });

    /** API documentation
     *  Present API for client use
     */
    app.get('/ui/index.html', (req, res) => {
    var docPath = path.join(__dirname, '../doc/index.html')
    return res.status(200).sendFile(docPath)
    });

    app.get('/ui/doc/miniapp/miniapp.html', (req, res) => {
    var docPath = path.join(__dirname, '../doc/miniapp.html') // shall be under doc
    return res.status(200).sendFile(docPath)
    });

    app.get('/ui/doc/miniapp/testcases.html', (req, res) => {
    var docPath = path.join(__dirname, '../doc/testcases.html')
    return res.status(200).sendFile(docPath)
    });

    app.get('/ui/doc/nrf91/nrf91.html', (req, res) => {
    var docPath = path.join(__dirname, '../doc/nrf91.html')
    return res.status(200).sendFile(docPath)
    });

    app.get('/resource/icon64_appwx_logo.png', (req, res) => {
    var docPath = path.join(__dirname, '../resource/icon64_appwx_logo.png')
    return res.status(200).sendFile(docPath)
    });

    app.get('/resource/nordic_logo.png', (req, res) => {
        var docPath = path.join(__dirname, '../resource/nordic_logo.png')
        return res.status(200).sendFile(docPath)
    });

    app.get('/resource/nordic_logo_horiz.png', (req, res) => {
        var docPath = path.join(__dirname, '../resource/nordic_logo_horiz.png')
        return res.status(200).sendFile(docPath)
    });

    /**  GET ALL TEST REPORTS
     *   Pop up all reports
     */
    app.get('/ui/miniapp/find/report/', (req, res) => {
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
        var supressedValue = {
            _id: 0,
        }
        db.collection(process.env.DB_COLLECTION_TESTREPORT).find({}).project(supressedValue).toArray((err, docs) => {
            if (err) return res.status(400).send(err)
                const result = {
                    matchedResults: docs.length,
                    contents: docs
                }
                return res.status(200).send(result)
            })
    });
 
    /**  GET REPORT BY MOBILE BRAND
     *   Return related reports by given specific brand name and OR return all reports by hitting the designated url
     */
   app.get('/ui/miniapp/find/report/brand/', async (req, res) => {
    let originalUrl = req.originalUrl
    let field = "mobileInfo.brand"
    let brand = req.query.pm
    let db = dbs.db(MINIAPP_PROD_DATABASE_NAME)

    if (originalUrl === '/ui/miniapp/find/report/brand/') {
        await db.collection(process.env.DB_COLLECTION_TESTREPORT).distinct(field, {}, (err, docs) => {
            if (err) return res.status(400).send(err)
                const result = {
                    matchedResults: docs.length,
                    contents: docs
                }
                res.status(200).send(result)
            })
        return
    }
    if (brand === undefined || brand === "") {
        return res.status(400).send("Bad request.")
    } 
        var query = {
            "mobileInfo.brand": brand 
        }
        var supressedValue = {
            _id: 0,
        }
        db.collection(process.env.DB_COLLECTION_TESTREPORT).find(query).project(supressedValue).toArray((err, docs) => {
            if (err) return res.status(400).send(err)
                const result = {
                    matchedResults: docs.length,
                    contents: docs
                }
                res.status(200).send(result)
            })
    });

    /** GET ALL ANDROID DEVICE REPORT
     *  Return all android device report
     */
   app.get('/ui/miniapp/find/report/platform/android/', (req, res) => {
    let platform = "android"
    let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
    var query = {
        'mobileInfo.platform': platform 
    };
    var supressedValue = {
        _id: 0,
    }
    db.collection(process.env.DB_COLLECTION_TESTREPORT).find({"mobileInfo.platform": "android" }).toArray((err, docs) => {
        if (err) return res.status(400).send(err)
            const result = {
                matchedResults: docs.length,
                contents: docs
            }
            res.status(200).send(result)
        })
    });

    /** GET ALL IOS DEVICE REPORT 
     *  Return all iOS device report
     */
   app.get('/ui/miniapp/find/report/platform/ios/', (req, res) => {
    let platform = "ios"
    let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
    var query = {
        "mobileInfo.platform": platform 
    };
    var supressedValue = {
        _id: 0,
    }
    db.collection(process.env.DB_COLLECTION_TESTREPORT).find(query).toArray((err, docs) => {
        if (err) return res.status(400).send(err)
            const result = {
                matchedResults: docs.length,
                contents: docs
            }
            res.status(200).send(result)
        })
    });

    /** GET REPORT BY SESSIONID
     *  Return report associated by the sessionid in json format
     */
   app.get('/ui/miniapp/find/report/sessionid/', (req, res) => {
        let id = req.query.pm
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
        if (id === undefined || id === "") {
            return res.status(404).send("The requested URL was not found on this server.")
        } 
        var query = {
            sessionID: id 
        };
        var supressedValue = {
            _id: 0,
        }
        db.collection(process.env.DB_COLLECTION_TESTREPORT).find(query).project(supressedValue).toArray((err, docs) => {
            if (err) return res.status(400).send(err)
            res.status(200).send(docs)
        })
    });

    /**  INSERT TESTCASE
     *   Return insertedid
     */
    app.post('/api/miniapp/insert/report/', (req, res) => {
        let report = req.body
        let db = dbs.db(MINIAPP_PROD_DATABASE_NAME)
        let result = db.collection(process.env.DB_COLLECTION_TESTREPORT).insertOne(report, function(err, object){
            if (err) return res.status(400).send(err)
            return res.status(200).send(object.insertedId) 
        }) 
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
    // app.get('/api/miniapp/initialize', (req, res) => {
    //     let db = dbs.db(MINIAPP_PROD_DATABASE_NAME);
    //     let collection = db.createCollection(process.env.DB_COLLECTION_TESTREPORT, (err, collection) => {
    //         if (err) return res.status(400).send(err)
    //         return res.status(200).send('succeed')
    //     })
    // });

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
    // app.get('/nrf91/test/init', (req, res) => {
    //     let db = dbs.db(TEST91_DATABASE_NAME);
    //     let resultTestCasesdb = db.createCollection(process.env.DB_TEST_COLLECTION_NRF91, (err, collection) => {
    //         if (err) return res.status(400).send(err)
    //         return res.status(200).send('succeed')
    //     })
    // })

    /**
     * RESPONSE TO UNUSED SERVICES
     */
    app.use((req, res) => {
        return res.redirect('/index');
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
