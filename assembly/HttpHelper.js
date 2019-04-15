(function(){    
    const { ipcRenderer } = require('electron')
    const {SystemModules,SelfModules} = require(ipcRenderer.sendSync('getRootPath') +'/assembly/RequireHelper')
    const http = SystemModules('http');
    const querystring = SystemModules('querystring');

    module.exports.post=(options,queryObj,callBack)=>{
       //设置默认值
        options = Object.assign({
            host: '', // 请求地址 域名，google.com等..
            port:80,
            path:'', // 具体路径eg:/upload
            method: 'POST', // 请求方式, 这里以post为例
            headers: { // 必选信息,  可以抓包工看一下
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' 
            }
        },options);
        let queryData = querystring.stringify(queryObj);
        options.headers["Content-Length"] = Buffer.byteLength(queryData);


        let req = http.request(options, function (res) {  
            res.setEncoding('utf8');  
            res.on('data', function (chunk) {  
                callBack(chunk);
            });  
        });  
          
        req.on('error', function (e) {  
            console.log('problem with request: ' + e.message);  
        });  
        req.write(queryData);
        req.end();
    }
})(); 