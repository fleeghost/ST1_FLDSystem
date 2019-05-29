const fs = require('fs');

window.onerror = function (message, source, lineno, colno, err) {
    let txt = "";
    txt += "Error: " + err.stack + '\r\n';
    txt += "Time: " + getFormatDate() + '\r\n';
    txt += "-----------------------------------------------------------" + '\r\n';
    writeFile(txt);
}

Vue.config.errorHandler = function (err, vm, info) {
    let txt = "";
    txt += "Error: " + err.stack + '\r\n';
    txt += "Time: " + getFormatDate() + '\r\n';
    txt += "-----------------------------------------------------------" + '\r\n';
    writeFile(txt);
};

function writeFile(txt) {
    txt = txt.replace(/   /g,'\r\n');
    fs.mkdir('./errorLog', function (error) {
        if (error) {
            console.log('目录已存在');
        }
        fs.appendFile('./errorLog/' + getFormatDate().split(' ')[0] + '.txt', txt, function (error) {
            if (error) {
                console.log(error);
                return false;
            }
            console.log('写入成功');
        })
    })
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