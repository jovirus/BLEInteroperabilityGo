/** Provide login services
 *  created by Jiajun Qiu @Nordic Semiconductor ASA 2018
 *  Email: jiajun.qiu@nordicsemi.no
 *  Lisence: GPL3.0
 *  See more detail on https://github.com/jovirus/ble-interoperabilityTest
 */

var seedrandom = require('seedrandom');

function random() {
    rng = seedrandom()
    console.log(rng())
}

function randomWithSeed(seed) {
    var rng = seedrandom(seed);
    console.log(rng())
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

let services = {
    writeCookie: writeCookie,
    readCookie: readCookie,
    random: random,
    randomWithSeed: randomWithSeed
}

module.exports = services;