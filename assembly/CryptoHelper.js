(function(){
    const crypto = require('crypto');
    //md5加密
    module.exports.md5 = (data)=>{
        const hash = crypto.createHash('md5');
        hash.update(data);
        return hash.digest('hex')
    }
    //aes加密
    module.exports.aesEncode = (data,key)=>{
        const cipher = crypto.createCipher('aes-192-cbc', key);
        var crypted = cipher.update(data, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    }
    //aes解密
    module.exports.aesDecode = (encrypted,key)=>{
        const decipher = crypto.createDecipher('aes-192-cbc', key);
        var decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

})()