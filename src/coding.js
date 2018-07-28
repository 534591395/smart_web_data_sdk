
const utf8Encode = function(string) {
    string = (string + '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    var utftext = '',
        start,
        end;
    var stringl = 0,
        n;

    start = end = 0;
    stringl = string.length;

    for (n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;

        if (c1 < 128) {
            end++;
        } else if ((c1 > 127) && (c1 < 2048)) {
            enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
        } else {
            enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.substring(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
    }

    if (end > start) {
        utftext += string.substring(start, string.length);
    }

    return utftext;
};

const base64Encode = function(data) {
    var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = '',
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data = utf8Encode(data);

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    switch (data.length % 3) {
        case 1:
            enc = enc.slice(0, -2) + '==';
            break;
        case 2:
            enc = enc.slice(0, -1) + '=';
            break;
    }

    return enc;
};

const sha1 = function(str){
    
   /*
     * A Javascript implementation of the Secure Hash Algorithm, SHA-1, as defined
     * in FIPS PUB 180-1
     * Version 2.1-BETA Copyright Paul Johnston 2000 - 2002.
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     * Distributed under the BSD License
     * See http://pajhome.org.uk/crypt/md5 for details.
     */
    /*
     * Configurable variables. You may need to tweak these to be compatible with
     * the server-side, but the defaults work in most cases.
     */
    var hexcase = 0; /* hex output format. 0 - lowercase; 1 - uppercase     */
    var b64pad = ""; /* base-64 pad character. "=" for strict RFC compliance  */
    var chrsz = 8; /* bits per input character. 8 - ASCII; 16 - Unicode    */
    /*
     * These are the functions you'll usually want to call
     * They take string arguments and return either hex or base-64 encoded strings
     */
    function hex_sha1(s) {
     return binb2hex(core_sha1(str2binb(s), s.length * chrsz));
    }
    function b64_sha1(s) {
     return binb2b64(core_sha1(str2binb(s), s.length * chrsz));
    }
    function str_sha1(s) {
     return binb2str(core_sha1(str2binb(s), s.length * chrsz));
    }
    function hex_hmac_sha1(key, data) {
     return binb2hex(core_hmac_sha1(key, data));
    }
    function b64_hmac_sha1(key, data) {
     return binb2b64(core_hmac_sha1(key, data));
    }
    function str_hmac_sha1(key, data) {
     return binb2str(core_hmac_sha1(key, data));
    }
    /*
     * Perform a simple self-test to see if the VM is working
     */
    function sha1_vm_test() {
     return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
    }
    /*
     * Calculate the SHA-1 of an array of big-endian words, and a bit length
     */
    function core_sha1(x, len) {
     /* append padding */
     x[len >> 5] |= 0x80 << (24 - len % 32);
     x[((len + 64 >> 9) << 4) + 15] = len;
     var w = Array(80);
     var a = 1732584193;
     var b = -271733879;
     var c = -1732584194;
     var d = 271733878;
     var e = -1009589776;
     for (var i = 0; i < x.length; i += 16) {
      var olda = a;
      var oldb = b;
      var oldc = c;
      var oldd = d;
      var olde = e;
      for (var j = 0; j < 80; j++) {
       if (j < 16) w[j] = x[i + j];
       else w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
       var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)), safe_add(safe_add(e, w[j]), sha1_kt(j)));
       e = d;
       d = c;
       c = rol(b, 30);
       b = a;
       a = t;
      }
      a = safe_add(a, olda);
      b = safe_add(b, oldb);
      c = safe_add(c, oldc);
      d = safe_add(d, oldd);
      e = safe_add(e, olde);
     }
     return Array(a, b, c, d, e);
    }
    /*
     * Perform the appropriate triplet combination function for the current
     * iteration
     */
    function sha1_ft(t, b, c, d) {
     if (t < 20) return (b & c) | ((~b) & d);
     if (t < 40) return b ^ c ^ d;
     if (t < 60) return (b & c) | (b & d) | (c & d);
     return b ^ c ^ d;
    }
    /*
     * Determine the appropriate additive constant for the current iteration
     */
    function sha1_kt(t) {
     return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 : (t < 60) ? -1894007588 : -899497514;
    }
    /*
     * Calculate the HMAC-SHA1 of a key and some data
     */
    function core_hmac_sha1(key, data) {
     var bkey = str2binb(key);
     if (bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);
     var ipad = Array(16),
      opad = Array(16);
     for (var i = 0; i < 16; i++) {
      ipad[i] = bkey[i] ^ 0x36363636;
      opad[i] = bkey[i] ^ 0x5C5C5C5C;
     }
     var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
     return core_sha1(opad.concat(hash), 512 + 160);
    }
    /*
     * Add integers, wrapping at 2^32. This uses 16-bit operations internally
     * to work around bugs in some JS interpreters.
     */
    function safe_add(x, y) {
     var lsw = (x & 0xFFFF) + (y & 0xFFFF);
     var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
     return (msw << 16) | (lsw & 0xFFFF);
    }
    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    function rol(num, cnt) {
     return (num << cnt) | (num >>> (32 - cnt));
    }
    /*
     * Convert an 8-bit or 16-bit string to an array of big-endian words
     * In 8-bit function, characters >255 have their hi-byte silently ignored.
     */
    function str2binb(str) {
     var bin = Array();
     var mask = (1 << chrsz) - 1;
     for (var i = 0; i < str.length * chrsz; i += chrsz)
     bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
     return bin;
    }
    /*
     * Convert an array of big-endian words to a string
     */
    function binb2str(bin) {
     var str = "";
     var mask = (1 << chrsz) - 1;
     for (var i = 0; i < bin.length * 32; i += chrsz)
     str += String.fromCharCode((bin[i >> 5] >>> (24 - i % 32)) & mask);
     return str;
    }
    /*
     * Convert an array of big-endian words to a hex string.
     */
    function binb2hex(binarray) {
     var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
     var str = "";
     for (var i = 0; i < binarray.length * 4; i++) {
      str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) + hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
     }
     return str;
    }
    /*
     * Convert an array of big-endian words to a base-64 string
     */
    function binb2b64(binarray) {
     var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
     var str = "";
     for (var i = 0; i < binarray.length * 4; i += 3) {
      var triplet = (((binarray[i >> 2] >> 8 * (3 - i % 4)) & 0xFF) << 16) | (((binarray[i + 1 >> 2] >> 8 * (3 - (i + 1) % 4)) & 0xFF) << 8) | ((binarray[i + 2 >> 2] >> 8 * (3 - (i + 2) % 4)) & 0xFF);
      for (var j = 0; j < 4; j++) {
       if (i * 8 + j * 6 > binarray.length * 32) str += b64pad;
       else str += tab.charAt((triplet >> 6 * (3 - j)) & 0x3F);
      }
     }
     return str;
    }

    return hex_sha1(str);
};

export {
  utf8Encode,
  base64Encode,
  sha1
}