/** This module is used to handel data storage.
 *  created by Jiajun Qiu @Nordic Semiconductor ASA 2018
 *  Email: jiajun.qiu@nordicsemi.no
 *  Lisence: GPL3.0
 *  See more detail on https://github.com/jovirus/ble-interoperabilityTest
 */

const userGroupEnum = require('../DataModel/userGroupEnum') 

 function createNrfUser(wxUserInfo, nrfUserGroup) {
    var info = wxUserInfo
    var ref = createRefNr()
    var newInfo = {
        openid: info.openid,
        nickname: info.nickname,
        sex: info.sex,
        language: info.language,
        city: info.city,
        province: info.province,
        country: info.country,
        headimgurl: info.headimgurl,
        privilege: info.privilege,
        unionid: info.unionid,
        usergroup: nrfUserGroup,
        indexMark: ref
    }
    return newInfo
 }

 function isUserExist(dbs, opendId = "") {
     return new Promise((resolve, reject) => { 
        let db = dbs.db(process.env.DB_WEB_NAME);
        var query = {
            openid: opendId 
        };
        var supressedValue = {
                    _id: 0,
        }
        db.collection(process.env.DB_COLLECTION_USERINFO).find(query).project(supressedValue).toArray((err, user) => {
            if (err) reject(err)
            else resolve(user)
        })
     })
 }

 function saveNewUser(dbs, nRFUserInfo) {
    return new Promise((resolve, reject) => { 
        let db = dbs.db(process.env.DB_WEB_NAME);
        let result = db.collection(process.env.DB_COLLECTION_USERINFO).insertOne(nRFUserInfo, function(err, object){
            if (err) reject(err)
            else resolve(true)
        }) 
     })
 }

 function authorizeAUser(dbs, refnr) {
    return new Promise((resolve, reject) => { 
        try {
            let db = dbs.db(process.env.DB_WEB_NAME);
            db.collection(process.env.DB_COLLECTION_USERINFO).updateOne(
                { hash: { $eq: hash } },
                { $set: { expire: new Date(expireTime) } }
             ).then((result) => {
                if (result.modifiedCount === 1) resolve(true)
                else resolve(false)
             })
        } catch (e) {
            reject(e)
        }
    })
 }

 function saveCookie(dbs, hash, token, openid, expire) {
    return new Promise((resolve, reject) => { 
        var cookie = {
            hash: hash,
            token: token,
            openid: openid,
            expire: expire
        }
        let db = dbs.db(process.env.DB_WEB_NAME);
        let result = db.collection(process.env.DB_COLLECTION_COOKIE).insertOne(cookie, function(err, object){
            if (err) reject(err)
            else resolve(true)
        }) 
     })
 }

 function deleteCookie(dbs, hash = "") {
    return new Promise((resolve, reject) => { 
        var query = {
            hash: hash
        }
        let db = dbs.db(process.env.DB_WEB_NAME);
        let result = db.collection(process.env.DB_COLLECTION_COOKIE).deleteOne(query, function(err, object){
            if (err) reject(err)
            else resolve(true)
        }) 
     })
 }

 function isCookieExist(dbs, hash = "") {
    return new Promise((resolve, reject) => { 
        var query = {
            hash: hash
        }
        var supressedValue = {
            _id: 0
        }
        let db = dbs.db(process.env.DB_WEB_NAME);
        let result = db.collection(process.env.DB_COLLECTION_COOKIE).find(query).project(supressedValue).toArray((err, cookies) => {
            if (err) reject(err)
            else resolve(cookies)
        })
     })
 }

 function createRefNr() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
 }

 let services = {
    createNrfUser: createNrfUser,
    saveNewUser: saveNewUser,
    isUserExist: isUserExist,
    saveCookie: saveCookie,
    deleteCookie: deleteCookie,
    isCookieExist: isCookieExist,
    createRefNr: createRefNr
 }

 module.exports = services