
var hostData = window.location;
var signtime = new Date().getTime();
$(function () {
    $.getScript("/assets/js/jquery.signalR-2.4.1.min.js", function () {
        $.getScript("http://" + hostData.host + "/signalr/hubs", function () {
            $.getScript("/assets/js/signalr-mediate.js", function () {

                $.signalrApi({
                    serverUrl: "http://" + hostData.host,
                    clientHub: "PageHub",
                    clientEvents: [
                        {
                            name: "onGlobalConnect",
                            method: function (data) {
                                //点击窗口重新计时
                                $('body').click(function () {
                                    var signalrData = {
                                        eventType: 'click',
                                        data: {}
                                    }
                                    $.signalrApi.server.applyInstruct($.cookie().admin, JSON.stringify(signalrData))
                                })

                                if (txt) {
                                    var signalrData = {
                                        eventType: 'error',
                                        data: txt
                                    }
                                    $.signalrApi.server.applyInstruct($.cookie().admin, JSON.stringify(signalrData))
                                    txt = '';
                                }


                            }
                        },
                        {
                            name: "onClientLive",
                            method: function (data) {
                                signtime = new Date().getTime();
                            }
                        }
                    ]
                });
                //socket连接
                function signalrConnect() {
                    $.signalrApi.start(function () {
                        $.signalrApi.server.globalConnect();
                    });
                }
                signalrConnect();

                setInterval(function () {
                    $.signalrApi.server.clientLive();
                    if (new Date().getTime() - signtime > 100000) {
                        signalrConnect();
                    }

                }, 10000);


            });
        });
    });



})

var txt = '';
//捕获js报错
window.onerror = function (message, source, lineno, colno, err) {
    let errorInfo = {
        error:err.stack,
        time:getFormatDate(),
        url:window.location.href
    }
    txt += JSON.stringify(errorInfo);
    txt += "----hzyc----";
    var signalrData = {
        eventType: 'error',
        data: txt,
    }
    try {
        $.signalrApi.server.applyInstruct($.cookie().admin, JSON.stringify(signalrData))
        txt = '';
    } catch (e) {

    }

}

//捕获vue报错
Vue.config.errorHandler = function (err, vm, info) {
    let errorInfo = {
        error:err.stack,
        time:getFormatDate(),
        url:window.location.href
    }
    txt += JSON.stringify(errorInfo);
    txt += "----hzyc----";
    var signalrData = {
        eventType: 'error',
        data: txt
    }
    try {
        $.signalrApi.server.applyInstruct($.cookie().admin, JSON.stringify(signalrData))
        txt = '';
    } catch (e) {

    }
};

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




