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


function random() {
    rng = seedrandom()
    console.log(rng())
}

function randomWithSeed(seed) {
    var rng = seedrandom(seed);
    console.log(rng())
}

function setCookie(req, res) {
    function onRequest(req, res) {
        // Parse the query string
        var query = url.parse(req.url, true, true).query;
       
        if (query && query.name) {
          // Set a new cookie with the name
          res.setHeader('Set-Cookie', cookie.serialize('name', String(query.name), {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7 // 1 week
          }));
       
          // Redirect back after setting cookie
          res.statusCode = 302;
          res.setHeader('Location', req.headers.referer || '/');
          res.end();
          return;
        }
       
        // Parse the cookies on the request
        var cookies = cookie.parse(req.headers.cookie || '');
       
        // Get the visitor name set in the cookie
        var name = cookies.name;
       
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
       
        if (name) {
          res.write('<p>Welcome back, <b>' + escapeHtml(name) + '</b>!</p>');
        } else {
          res.write('<p>Hello, new visitor!</p>');
        }
       
        res.write('<form method="GET">');
        res.write('<input placeholder="enter your name" name="name"> <input type="submit" value="Set Name">');
        res.end('</form');
      }
}

function writeCookie(name,value,days) {
    var date, expires;
    if (days) {
        date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        expires = "; expires=" + date.toGMTString();
            }else{
        expires = "";
    }
    var cookie = name + "=" + value + expires + "; path=/"
    console.log(cookie)
    if (typeof document !== 'undefined') {
        document.cookie = cookie
    }
}

function readCookie(name) {
    var i, c, ca, nameEQ = name + "=";
    ca = document.cookie.split(';');
    for(i=0;i < ca.length;i++) {
        c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1,c.length);
        }
        if (c.indexOf(nameEQ) == 0) {
            return c.substring(nameEQ.length,c.length);
        }
    }
    return '';
}

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
            resolve(rawJson)
        }).catch(function(error) {
            reject(error)
        })
    })
}

let services = {
    writeCookie: writeCookie,
    readCookie: readCookie,
    random: random,
    randomWithSeed: randomWithSeed,
    getWxLoginQRCode: getWxLoginQRCode,
    getWxLoginToken: getWxLoginToken,
    getWxUserInfo: getWxUserInfo,
    setCookie: setCookie
}

module.exports = services;