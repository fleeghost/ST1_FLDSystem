const fs = require('fs');

window.onerror = function (message, source, lineno, colno, err) {
    let txt = "";
    let errorInfo = {
        error:err.stack,
        time:getFormatDate(),
        url:window.location.href
    }
    txt += JSON.stringify(errorInfo);
    txt += "----hzyc----";
    writeFile(txt);
}

Vue.config.errorHandler = function (err, vm, info) {
    let txt = "";
    let errorInfo = {
        error:err.stack,
        time:getFormatDate(),
        url:window.location.href
    }
    txt += JSON.stringify(errorInfo);
    txt += "----hzyc----";
    writeFile(txt);
};

function writeFile(txt) {
    // txt = txt.replace(/     /g, '\r\n');
    fs.mkdir('./errorLog', function (error) {
        if (error) {
            // console.log('目录已存在');
        }
        fs.appendFile('./errorLog/' + getFormatDate().split(' ')[0] + '.txt', txt, function (error) {
            if (error) {
                console.log(error);
                return false;
            }
            console.warn('error文件写入')
        })
    })
}


function readFile(path,callback) {
    path = './errorLog/' + path;
    fs.exists(path, function (exists) {
        if (exists) {
            fs.readFile(path, {encoding:'utf-8'}, function (err, data) {
                if (err) {
                    throw err;
                }
                if(callback){
                    callback(data);
                }
            });
        } else {
            callback('');
        }
    });
}

function getFormatDate(date) {
    if (!date) date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    if (hour >= 0 && hour <= 9) {
        hour = "0" + hour;
    }
    if (minute >= 0 && minute <= 9) {
        minute = "0" + minute;
    }
    if (second >= 0 && second <= 9) {
        second = "0" + second;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + hour + seperator2 + minute
        + seperator2 + second;
    return currentdate;
}