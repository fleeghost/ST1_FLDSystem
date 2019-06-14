(function(){    
    const { ipcRenderer } = require('electron')
    const {SystemModules,SelfModules} = require(ipcRenderer.sendSync('getRootPath') +'/assembly/RequireHelper')
    const http = SystemModules('http');
    const querystring = SystemModules('querystring');
    const Config = require(ipcRenderer.sendSync('getRootPath')+'/config/config.json')

    module.exports.post=(options,queryObj,callBack,failCallBack)=>{
       //设置默认值
        options = Object.assign({
            host:Config.Http_config.ip,
            port:Config.Http_config.port, // 请求地址 域名，google.com等..
            path:'', // 具体路径eg:/upload
            method: 'POST', // 请求方式, 这里以post为例
            headers: { // 必选信息,  可以抓包工看一下
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' 
            }
        },options);
        //添加平台
        queryObj["platform"] = "pc";
        let queryData = querystring.stringify(queryObj);
        options.headers["Content-Length"] = Buffer.byteLength(queryData);

        let req = http.request(options, function (res) {  
            let rawData = '';
            res.setEncoding('utf8');  
            res.on('data', function (chunk) {  
                rawData+=chunk;
                //callBack(chunk);
            });  
            res.on('end',()=>{
                callBack(rawData);
            })

        });  
          
        req.on('error', function (e) {  
            layer.msg('网络出现问题，ERROR:'+e.message);
            //console.log('problem with request: ' + e.message);  
            if(failCallBack){
                failCallBack(e);
            }
        });  
        req.write(queryData);
        req.end();
    }
})(); 