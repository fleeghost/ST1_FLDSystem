(function () {
    const { ipcRenderer } = require('electron')
    const { SystemModules, SelfModules } = require(ipcRenderer.sendSync('getRootPath') + '/assembly/RequireHelper')
    const http = SystemModules('http');
    const querystring = SystemModules('querystring');
    const Config = require(ipcRenderer.sendSync('getRootPath') + '/config/config.json')
    const util = require('util');
    const request = require('request')

    module.exports.post = (options, queryObj, callBack, failCallBack) => {
        //设置默认值
        options = Object.assign({
            host: Config.Http_config.ip,
            port: Config.Http_config.port, // 请求地址 域名，google.com等..
            path: '', // 具体路径eg:/upload
            method: 'POST', // 请求方式, 这里以post为例
            headers: { // 必选信息,  可以抓包工看一下
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        }, options);
        //添加平台
        queryObj["platform"] = "pc";
        let queryData = querystring.stringify(queryObj);
        options.headers["Content-Length"] = Buffer.byteLength(queryData);

        let req = http.request(options, function (res) {
            let rawData = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                rawData += chunk;
                //callBack(chunk);
            });
            res.on('end', () => {
                callBack(rawData);
            })

        });

        req.on('error', function (e) {
            layer.msg('网络出现问题，ERROR:' + e.message);
            //console.log('problem with request: ' + e.message);  
            if (failCallBack) {
                failCallBack(e);
            }
        });
        req.write(queryData);
        req.end();
    }


    module.exports.ajaxPost = (url, queryObj, callBack) => {
        var cookieArray = [];
        try{
            for (const key in $.cookie()) {
                cookieArray.push(key+"="+ encodeURI($.cookie()[key]));
            }
            cookieArray = cookieArray;
        }
        catch(e){}


        //设置默认值
        let options = {
            host: Config.Http_config.ip,
            port: Config.Http_config.port, // 请求地址 域名，google.com等..
            path: url, // 具体路径eg:/upload
            method: 'POST', // 请求方式, 这里以post为例
            headers: { // 必选信息,  可以抓包工看一下
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Cookie':cookieArray
                
            }
        }
        //添加平台
        queryObj["platform"] = "pc";
        let queryData = querystring.stringify(queryObj);
        options.headers["Content-Length"] = Buffer.byteLength(queryData);

        let req = http.request(options, function (res) {
            let rawData = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                rawData += chunk;
                //callBack(chunk);
            });
            res.on('end', () => {
                callBack(rawData);
            })

        });

        req.on('error', function (e) {
            //  layer.msg('网络出现问题，ERROR:'+e.message);
            //  //console.log('problem with request: ' + e.message);  
            //  if(failCallBack){
            //      failCallBack(e);
            //  }
        });
        req.write(queryData);
        req.end();
    }



    module.exports.ajaxAsyncPost = function (url, queryObj,callBack) {
        let ajaxAsync = function (url, queryObj) {
            //设置默认值
            let options = {
                host: Config.Http_config.ip,
                port: Config.Http_config.port, // 请求地址 域名，google.com等..
                path: url, // 具体路径eg:/upload
                method: 'POST', // 请求方式, 这里以post为例
                headers: { // 必选信息,  可以抓包工看一下
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            }
            //添加平台
            queryObj["platform"] = "pc";
            let queryData = querystring.stringify(queryObj);
            options.headers["Content-Length"] = Buffer.byteLength(queryData);

            return new Promise(function (resolve, reject) {
                let req = http.request(options, function (res) {
                    let rawData = '';
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        rawData += chunk;
                        //callBack(chunk);
                    });
                    res.on('end', () => {
                        callBack(rawData);
                        resolve(rawData);
                        //callBack(rawData);
                    })
                });

                req.on('error', function (e) {
                    //  layer.msg('网络出现问题，ERROR:'+e.message);
                    //  //console.log('problem with request: ' + e.message);  
                    //  if(failCallBack){
                    //      failCallBack(e);
                    //  }
                });
                req.write(queryData);
                req.end();
            })
        }

        async function f1() {
            var res = await ajaxAsync(url, queryObj);
            return res;
        }
        return f1();
    }


})(); 