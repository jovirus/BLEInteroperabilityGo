/** This module is used to handel data storage.
 *  created by Jiajun Qiu @Nordic Semiconductor ASA 2018
 *  Email: jiajun.qiu@nordicsemi.no
 *  Lisence: GPL3.0
 *  See more detail on https://github.com/jovirus/ble-interoperabilityTest
 */

const userGroupEnum = require('../DataModel/userGroupEnum') 

 function createNrfUser(wxUserInfo, nrfUserGroup) {
    var info = JSON.parse(userInfo)
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
        unionid: unionid,
        usergroup: nrfUserGroup
    }
    return newInfo
 }

 function isUserExist(dbs, wxUserInfo) {
     return new Promise((resolve, reject) => { 
        let db = dbs.db(process.env.DB_WEB_NAME);
        var query = {
            "mobileInfo.platform": wxUserInfo.openid 
        };
        var supressedValue = {
                    _id: 0,
        }
        db.collection(process.env.DB_COLLECTION_USERINFO).find(query).project(supressedValue).toArray((err, user) => {
                if (user.length == 0) {
                    resolve(false)
                } else if (user.length == 1) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            })
     })
 }

 function saveNewUser(dbs, nRFUserInfo) {
    return new Promise((resolve, reject) => { 
        let db = dbs.db(process.env.DB_WEB_NAME);
        let result = db.collection(process.env.DB_COLLECTION_USERINFO).insertOne(nRFUserInfo, function(err, object){
            if (err) reject(err)
            else resolve(object)
        }) 
     })
 }

 let services = {
    createNrfUser: createNrfUser,
    saveNewUser: saveNewUser,
    isUserExist: isUserExist
 }

 module.exports = services