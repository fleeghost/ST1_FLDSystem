
var hostData = window.location;
var signtime = new Date().getTime();
$(function () {
    $.getScript("/assets/js/jquery.cookie.js", function () {
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

                    $('body').click(function () {
                        var signalrData = {
                            eventType: 'click',
                            data: {}
                        }
                        $.signalrApi.server.applyInstruct($.cookie().admin, JSON.stringify(signalrData))
                    })
                });
            });
        });

    })

})