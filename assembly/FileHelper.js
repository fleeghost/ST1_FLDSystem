(function(){    
    const fs = require('fs')
    
    module.exports.writeFile=(path,fileContent,callBack)=>{
       let filePath = path;
       let data = new Uint8Array(Buffer.from(fileContent,'utf8'));
       fs.writeFile(filePath, data, (err) => {
        if(callBack){
            callBack(err);
        }
      });
    }
    module.exports.readFile=()=>{
       
    }

})(); 