/** This module is used to handel data storage.
 *  created by Jiajun Qiu @Nordic Semiconductor ASA 2018
 *  Email: jiajun.qiu@nordicsemi.no
 *  Lisence: GPL3.0
 *  See more detail on https://github.com/jovirus/ble-interoperabilityTest
 */

const userGroupEnum = require('../DataModel/userGroupEnum') 

 function createNrfUser(wxUserInfo, nrfUserGroup) {
    var info = JSON.parse(wxUserInfo)
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
        usergroup: nrfUserGroup
    }
    return newInfo
 }

 function isUserExist(dbs, opendId) {
    console.log("Requested userInfo: ", opendId)
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

 function saveCookie(dbs, token, hash, openid, expire) {
    return new Promise((resolve, reject) => { 
        var cookie = {
            token: token,
            hash: hash,
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

 let services = {
    createNrfUser: createNrfUser,
    saveNewUser: saveNewUser,
    isUserExist: isUserExist,
    saveCookie: saveCookie
 }

 module.exports = services