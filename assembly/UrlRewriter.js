(function(){    
    const {SystemModules,SelfModules} = require('./RequireHelper')
    const path = SystemModules('path');
    const url = SystemModules('url');
    //伪静态网址路径
    const rewriterRules=new Array({
        lookFor:'^\/(\\d*)\/(.*).html$',
        sendTo:path.join(__dirname, '/app/modules/Home/View/Login.html?id=$1&name=$2')
    });

    module.exports.RewriteUrl=(staticUrl)=>{
        let staticPath = url.parse(staticUrl).pathname;
        let actualPath = staticPath;
        for(let rule of rewriterRules){
            let reg = new RegExp(rule.lookFor);
            if(reg.test(staticPath)){
                actualPath = staticPath.replace(reg,rule.sendTo);
            }
        }
        return url.format({
            pathname: path.join(__dirname,actualPath),
            protocol: 'file:',
            slashes: true
          })
    }
})(); 