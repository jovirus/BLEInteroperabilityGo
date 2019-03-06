/** Provide login services
 *  created by Jiajun Qiu @Nordic Semiconductor ASA 2018
 *  Email: jiajun.qiu@nordicsemi.no
 *  Lisence: GPL3.0
 *  See more detail on https://github.com/jovirus/ble-interoperabilityTest
 */

var seedrandom = require('seedrandom')
const networkHandler = require('./networkHandler')
var cookie = require('cookie')
var url = require('url')
const crypto = require('crypto');

function random() {
    rng = seedrandom()
    console.log(rng())
}

function randomWithSeed(seed) {
    var rng = seedrandom(seed);
    console.log(rng())
}

function getExpireTime(millisecond) {
    var date = new Date();
    return date.setTime(date.getTime() + millisecond);
}

function setToExpire() {
    var date = new Date();
    return date.setTime(date.getTime() - (1000*60*60*24));
}

function verifyCookie(dbs, hash="") {
    return new Promise((resolve, reject) => { 
        let db = dbs.db(process.env.DB_WEB_NAME);
        let result = db.collection(process.env.DB_COLLECTION_USERINFO).aggregate([
            {
                $lookup:
                   {
                     from: process.env.DB_COLLECTION_COOKIE,
                     let: { userInfo_openid: "$openid", cookie_hash: hash },
                     pipeline: [
                        { $match:
                           { $expr:
                              { $and:
                                 [ {$eq: ["$hash", "$$cookie_hash"] },
                                   { $eq: [ "$openid", "$$userInfo_openid" ] },
                                   { $gte: [ "$expire", new Date() ] }
                                 ]
                              }
                           }
                        },
                        { $project: { openid: 0, _id: 0 } }
                     ],
                     as: "user_cookie"
                   }
              },
             {
               $unwind:
                 {
                   path : "$user_cookie",
                   preserveNullAndEmptyArrays: false
                 }
             },
             {
               $limit: 20
             },
             {
               $project: 
                  {
                    _id: 0,
                    sex: 0,
                    language: 0,
                    city: 0,
                    province: 0,
                    headimgurl: 0,
                    privilege: 0
                  } 
             }
        ]).toArray((err, user_cookie) => {
            if (err) reject(err)
            else resolve(user_cookie)
        })
     })
}

function setCookieToExpire(dbs, hash="") {
    return new Promise((resolve, reject) => { 
        try {
            var expireTime = setToExpire()
            let db = dbs.db(process.env.DB_WEB_NAME);
            db.collection(process.env.DB_COLLECTION_COOKIE).updateOne(
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
        
// function writeCookie(name,value,days) {
//     var date, expires;
//     if (days) {
//         date = new Date();
//         date.setTime(date.getTime()+(days*24*60*60*1000));
//         expires = "; expires=" + date.toGMTString();
//             }else{
//         expires = "";
//     }
//     var cookie = name + "=" + value + expires + "; path=/"
//     console.log(cookie)
//     if (typeof document !== 'undefined') {
//         document.cookie = cookie
//     }
// }

// /**
//  * Read a cookie
//  * @param {String} cname, cookie name
//  */
// function readCookie(cname) {
//     var name = cname + "="; //Create the cookie name variable with cookie name concatenate with = sign
//     if (typeof document !== 'undefined') {
//         var cArr = document.cookie.split(';'); //Create cookie array by split the cookie by ';'
//         //Loop through the cookies and return the cooki value if it find the cookie name
//         for(var i=0; i<cArr.length; i++) {
//             var c = cArr[i].trim();
//             //If the name is the cookie string at position 0, we found the cookie and return the cookie value
//             if (c.indexOf(name) == 0) 
//                 return c.substring(name.length, c.length);
//         }
//         //If we get to this point, that means the cookie wasn't find in the look, we return an empty string.
//         return "";
//         }
// }

// /**
//  * Delete a cookie
//  * @param {String} cname, cookie name
//  */
// function deleteCookie(cname) {
//     var d = new Date(); //Create an date object
//     d.setTime(d.getTime() - (1000*60*60*24)); //Set the time to the past. 1000 milliseonds = 1 second
//     var expires = "expires=" + d.toGMTString(); //Compose the expirartion date
//     if (typeof document !== 'undefined') {
//         document.cookie = cname+"="+"; "+expires;//Set the cookie with name and the expiration date
//     }
// }

function getWxLoginQRCode() {
    return new Promise((resolve, reject) => {
        const options = new URL(`https://open.weixin.qq.com/connect/qrconnect?appid=${process.env.LOGIN_WX_APP_ID}&redirect_uri=${process.env.LOGIN_WX_REDIRECT_URL}&response_type=code&scope=snsapi_login&state=STATE`)
        networkHandler.httpsRequest(options).then((rawHTML) => {
            var modifiedResult = rawHTML.replace("/connect/qrcode/", "https://open.weixin.qq.com/connect/qrcode/")
            resolve(modifiedResult)
        }).catch(function(error) {
            reject(error)
          })
    })
}

function getWxLoginToken(wxCode) {
    return new Promise((resolve, reject) => {
        const options = new URL(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.LOGIN_WX_APP_ID}&secret=${process.env.LOGIN_WX_APP_SECRET}&code=${wxCode}&grant_type=authorization_code`)
        networkHandler.httpsRequest(options).then((rawJson) => {
            resolve(rawJson)
        }).catch(function(error) {
            reject(error)
          })
    })
}


function getWxUserInfo(token, openId) {
    return new Promise((resolve, reject) => {
        const options = new URL(`https://api.weixin.qq.com/sns/userinfo?access_token=${token}&openid=${openId}&lang=zh_CN`)
        networkHandler.httpsRequest(options).then((rawJson) => {
            var user = JSON.parse(rawJson)
            resolve(user)
        }).catch(function(error) {
            reject(error)
        })
    })
}

function generate256RandomBytes() {
    const buf = crypto.randomBytes(256);
}

function generateHash(token) {
    const hash = crypto.createHash('sha256')
    hash.update(token)
    var digi = hash.digest('hex')
    return digi
}

let services = {
    random: random,
    randomWithSeed: randomWithSeed,
    getWxLoginQRCode: getWxLoginQRCode,
    getWxLoginToken: getWxLoginToken,
    getWxUserInfo: getWxUserInfo,
    generate256RandomBytes: generate256RandomBytes,
    generateHash: generateHash,
    getExpireTime: getExpireTime,
    setToExpire: setToExpire,
    verifyCookie: verifyCookie,
    setCookieToExpire, setCookieToExpire
}

module.exports = services;