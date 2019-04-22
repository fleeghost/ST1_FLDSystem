(function(){    
    const path = require('path')
    const {ipcRenderer} = require('electron')
    const fs = require('fs')
    const basePath=__dirname+'/';
    module.exports.SystemModules=(name)=>{
        return require(name);
    }
    module.exports.SelfModules=(name)=>{
        switch(name){
            case 'urlRewriter':return require(basePath+'UrlRewriter.js');
            case 'cryptoHelper':return require(basePath+'CryptoHelper.js');
            case 'DbHelper':return require(basePath+'DbHelper.js');
            case 'httpHelper':return require(basePath+'HttpHelper.js');
            case 'fileHelper':return require(basePath+'FileHelper.js');
        }
    }
    module.exports.SelfService=(moduleName,serviceName)=>{
        let rootPath = path.join(__dirname,'../')
        return require(rootPath+'app/modules/'+moduleName+'/Service/'+serviceName+'Service.js')
    }
    module.exports.NameSpace = (nameSpaceName)=>{
        var dirPath = path.join(__dirname,'../')+nameSpaceName;
        let files = fs.readdirSync(dirPath);
        let requireObj = {};
        files.forEach((item, index)=> {
            let filePath = dirPath + '/' + item;
            let stat = fs.statSync(filePath);
            let requireName = path.parse(filePath);
            requireObj[requireName.name] = require(filePath);
        })
        return requireObj;
    }

})(); 