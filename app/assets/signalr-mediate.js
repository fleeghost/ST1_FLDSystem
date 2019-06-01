(function ($) {
    $.signalrApi = function (options) {
        /********内部变量开始********/
        //signalr通讯中间项
        /********内部变量结束*******/
        /********外部变量开始********/
        //客户端变量
        $.signalrApi.client = undefined;
        //服务端变量
        $.signalrApi.server = undefined;
        /********外部变量结束*******/
        options = $.extend({
            //服务器地址
            serverUrl: "",
            clientHub:"",
            //客户端事件数组
            clientEvents: []
        }, options);
        //var clientHubObj = $.connection.IMHub;
        //eval("var clientHubObj = $.connection." + options.clientHub);
        $.connection[options.clientHub].connection.url=options.serverUrl+"/signalr";
        $.connection[options.clientHub].url = options.serverUrl;
        $.signalrApi.client = $.connection[options.clientHub].client;
        $.signalrApi.server = $.connection[options.clientHub].server;
        //执行注册客户端事件
        RegisterClientMethods();

        /*******内部事件开始******/
        //注册客户端事件
        function RegisterClientMethods() {
            for (var i = 0; i < options.clientEvents.length; i++) {
                eval("$.signalrApi.client." + options.clientEvents[i].name + " = " + options.clientEvents[i].method);
            }

        }
        /*******内部事件结束******/


        /*******外部事件开始******/
        //连接开始事件
        $.signalrApi.start = function (callBack) {
            $.connection.hub.start().done(function () {
                if (typeof (callBack) === "function") {
                    callBack();
                }
            }).fail(function(e){
                // alert(JSON.stringify(e));
            });;
        }
        /*******外部事件结束******/
    }
})($);