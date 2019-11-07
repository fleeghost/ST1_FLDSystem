/*
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-08-26 19:08:54
 * @LastEditTime: 2019-08-26 19:08:54
 * @LastEditors: your name
 */
(function () {
    const { post } = SelfModules('httpHelper')
    const Config = require(ipcRenderer.sendSync('getRootPath') + '/config/config.json');

    //更改默认头像
    let changeHeadImg = (headImg) => {
        if (!headImg) {
            return "image/header.png";
        }
        else {
            return headImg;
        }
    }

    $.clientCallBacks = {};
    //通讯Signalr
    let signalRHelper = () => {
        $.getScript("assets/jquery/jquery.signalR-2.4.1.min.js", function () {
            $.getScript("http://" + Config.Http_config.ip + ':' + Config.Http_config.port + "/signalr/hubs", function () {
                $.getScript("assets/jquery/signalr-mediate.js", function () {
                    $.signalrApi({
                        serverUrl: "http://" + Config.Http_config.ip + ':' + Config.Http_config.port,
                        clientHub: "IMHub",
                        clientEvents: [
                            {
                                name: "onClientConnect",
                                method: function (data) {
                                    $.clientCallBacks["onClientConnect"](data);
                                }
                            },
                            {
                                name: "onChatMsg",
                                method: function (userId, msg, timestap) {
                                    $.clientCallBacks["onChatMsg"](userId, msg, timestap);
                                }
                            },
                            {
                                name: "onGroupMsg",
                                method: function (userId, groupId, msg, timestap) {
                                    $.clientCallBacks["onGroupMsg"](userId, groupId, msg, timestap);
                                }
                            },
                            {
                                name: "onUserOnlineNotify",
                                method: function (userInfo) {
                                    $.clientCallBacks["onUserOnlineNotify"](userInfo);
                                }
                            },
                            {
                                name: "onUserOfflineNotify",
                                method: function (userId) {
                                    $.clientCallBacks["onUserOfflineNotify"](userId);
                                }
                            }
                        ]
                    });
                    //socket连接
                    function signalrConnect() {
                        $.signalrApi.start(function () {
                            var userId = localStorage.getItem("UserID");
                            $.signalrApi.server.clientConnect(userId);
                        });
                    }
                    signalrConnect();

                    setInterval(function () {

                        try {
                            $.signalrApi.server.clientLive();
                        } catch (e) {
                            $.signalrApi.start(function () {
                                var userId = localStorage.getItem("UserID");
                                $.signalrApi.server.clientConnect(userId);
                            });
                        }

                        // if (new Date().getTime() - lockTime > 30 * 60 * 1000) {
                        //     vm.pageLock = true;
                        // }

                    }, 2000);
                });
            });
        })
    }
    //当前用户信息
    let mine, friend;
    module.exports.config = () => {
        layui.use('layim', function (layim) {
            post({
                path: '/Frame/SqlData'
            }, {
                    cmdname: 'GetChatUser',
                    userID: localStorage.getItem("UserID")
                }, (ret) => {
                    let data = JSON.parse(ret);
                    if (data.status == 200) {
                        var userInfo = data.data;
                        mine = {
                            username: userInfo.ds[0].UserName,
                            id: userInfo.ds[0].UserID.toString(),
                            "status": "online",
                            sign: userInfo.ds[0].Sign,
                            avatar: changeHeadImg(userInfo.ds[0].HeadImg)
                        };
                        var friendInfo = [{
                            "groupname": "福路德用户",
                            id: 1
                        }];
                        var groups = [];
                        friend = [];
                        //用户列表
                        for (var i = 0; i < userInfo.ds1.length; i++) {
                            friend.push({
                                username: userInfo.ds1[i].UserName,
                                id: userInfo.ds1[i].UserID.toString(),
                                "status": userInfo.ds1[i].ContextIDs ? "online" : 'offline',
                                sign: userInfo.ds1[i].Sign,
                                avatar: changeHeadImg(userInfo.ds1[i].HeadImg),
                                contextIDs: userInfo.ds1[i].ContextIDs
                            })
                        }
                        //群列表
                        for (var i = 0; i < userInfo.ds2.length; i++) {
                            groups.push({
                                "groupname": userInfo.ds2[i].GroupName,
                                "id": userInfo.ds2[i].GroupID,
                                "avatar": "image/group.png" //群组头像
                            })
                        }


                        friendInfo[0].list = friend;
                        //signalR连接
                        $.clientCallBacks["onClientConnect"] = (contextID) => {
                            mine["contextIDs"] = contextID;
                        }
                        $.clientCallBacks["onChatMsg"] = (userId, msg, timestamp) => {
                            let fs = friend.filter(item => item.id == userId);
                            if (fs.length > 0) {
                                //接收消息
                                layim.getMessage({
                                    username: fs[0].username
                                    , avatar: fs[0].avatar
                                    , id: fs[0].id
                                    , type: "friend" //聊天窗口来源类型，从发送消息传递的to里面获取
                                    , content: msg
                                    , cid: 0 //消息id，可不传。除非你要对消息进行一些操作（如撤回）
                                    , mine: false //是否我发送的消息，如果为true，则会显示在右方
                                    , fromid: fs[0].id //消息的发送者id（比如群组中的某个消息发送者），可用于自动解决浏览器多窗口时的一些问题
                                    , timestamp: timestamp * 1000 - 8 * 60 * 60 * 1000 //服务端时间戳毫秒数。注意：如果你返回的是标准的 unix 时间戳，记得要 *1000
                                });
                                document.getElementById('msg_mp3').play();
                                ipcRenderer.send('twinkle')
                                setTimeout(function(){
                                    if ($(".layui-layim-chat").length > 0) {
                                        //更新最后阅读时间
                                        post({
                                            path: '/Frame/SqlData'
                                        }, {
                                                cmdname: 'UpdateReaderTime',
                                                userID: localStorage.getItem("UserID")
                                            }, (ret) => {
                                            });
                                    }
                                },0);

                            }
                        }
                        $.clientCallBacks["onGroupMsg"] = (userId, groupId, msg, timestamp) => {
                            let fs = friend.filter(item => item.id == userId);
                            if (fs.length > 0) {
                                //接收消息
                                layim.getMessage({
                                    username: fs[0].username
                                    , avatar: fs[0].avatar
                                    , id: groupId
                                    , type: "group" //聊天窗口来源类型，从发送消息传递的to里面获取
                                    , content: msg
                                    , cid: 0 //消息id，可不传。除非你要对消息进行一些操作（如撤回）
                                    , mine: false //是否我发送的消息，如果为true，则会显示在右方
                                    , fromid: fs[0].id //消息的发送者id（比如群组中的某个消息发送者），可用于自动解决浏览器多窗口时的一些问题
                                    , timestamp: timestamp * 1000 - 8 * 60 * 60 * 1000 //服务端时间戳毫秒数。注意：如果你返回的是标准的 unix 时间戳，记得要 *1000
                                });
                                document.getElementById('msg_mp3').play();
                                ipcRenderer.send('twinkle')
                                setTimeout(function(){
                                    if ($(".layui-layim-chat").length > 0) {
                                        //更新最后阅读时间
                                        post({
                                            path: '/Frame/SqlData'
                                        }, {
                                                cmdname: 'UpdateReaderTime',
                                                userID: localStorage.getItem("UserID")
                                            }, (ret) => {
                                            });
                                    }
                                },0);
                            }

                        }


                        $.clientCallBacks["onUserOnlineNotify"] = (info) => {
                            let userInfo = JSON.parse(info);
                            if (friend.filter(item => item.id.toString() == userInfo.UserID.toString()).length > 0) {
                                layim.setFriendStatus(userInfo.UserID.toString(), 'online');
                            }
                            else {
                                //如果用户不存在，则把该用户加入好友圈
                                layim.addList({
                                    type: 'friend'
                                    , avatar: changeHeadImg(userInfo.HeadImg)
                                    , username: userInfo.UserName
                                    , groupid: 1 //所在的分组id
                                    , id: userInfo.UserID.toString()
                                    , sign: userInfo.Sign
                                });
                                layim.setFriendStatus(userInfo.UserID.toString(), 'online');
                            }
                        }
                        $.clientCallBacks["onUserOfflineNotify"] = (userId) => {
                            layim.setFriendStatus(userId.toString(), 'offline');
                        }
                        signalRHelper();
                        //基础配置
                        layim.config({
                            init: {
                                mine: mine
                                , friend: friendInfo
                                , group: groups
                            }
                            , members: {
                                url: "http://" + Config.Http_config.ip + ':' + Config.Http_config.port + '/Frame/ST1_FLD/Handler.aspx?cmd=getMembers' //接口地址
                                , type: 'post' //默认get，一般可不填
                            }
                            //上传图片接口（返回的数据格式见下文），若不开启图片上传，剔除该项即可
                            , uploadImage: {
                                url: "http://" + Config.Http_config.ip + ':' + Config.Http_config.port + '/Frame/ST1_FLD/Handler.aspx?cmd=chatUploadImg' //接口地址
                                , type: 'post' //默认post
                            }
                            //上传文件接口（返回的数据格式见下文），若不开启文件上传，剔除该项即可
                            , uploadFile: {
                                url: "http://" + Config.Http_config.ip + ':' + Config.Http_config.port + '/Frame/ST1_FLD/Handler.aspx?cmd=chatUploadFile' //接口地址
                                , type: 'post' //默认post
                            }
                            , chatLog: layui.cache.dir + 'css/modules/layim/html/chatlog.html' //聊天记录页面地址，若不开启，剔除该项即可
                        });
                        //监听发送消息
                        layim.on('sendMessage', function (res) {
                            let fromContextID = mine.contextIDs;
                            let fromUserID = mine.id;
                            let toUserID = res.to.id;
                            let msg = res.mine.content;
                            let sendType = res.to.type;
                            if (sendType == 'friend') {
                                $.signalrApi.server.chatMsg(fromContextID, fromUserID, toUserID, msg);
                            }
                            else {
                                $.signalrApi.server.groupMsg(fromContextID, fromUserID, toUserID, msg);
                            }
                            //更新最后阅读时间
                            post({
                                path: '/Frame/SqlData'
                            }, {
                                    cmdname: 'UpdateReaderTime',
                                    userID: localStorage.getItem("UserID")
                                }, (ret) => {
                                });
                        });
                        layim.on('sign', function (value) {
                            post({
                                path: '/Frame/SqlData'
                            }, {
                                    cmdname: 'UpdateUserSign',
                                    userID: localStorage.getItem("UserID"),
                                    sign: value
                                }, (ret) => {
                                });
                        });
                        layim.on('chatChange', function (obj) {
                            //更新最后阅读时间
                            post({
                                path: '/Frame/SqlData'
                            }, {
                                    cmdname: 'UpdateReaderTime',
                                    userID: localStorage.getItem("UserID")
                                }, (ret) => {
                                });
                        });
                        setTimeout(() => {
                            $("#layui-layer100001").css({
                                top: '-521px',
                                right: '0px',
                                visibility: 'hidden',
                            });
                            var setWinObj = $("#layui-layer100001").find(".layui-layer-close1").parent();
                            setWinObj.html('<a class="layui-layer-ico layui-layer-close layui-layer-close1 el-icon-minus" href="javascript:;" onclick="layimConfig.hideLayim()" ></a>');
                        }, 0);
                        setTimeout(() => {
                            //获取未读信息
                            post({
                                path: '/Frame/SqlData'
                            }, {
                                    cmdname: 'getUnReadMsg',
                                    userID: localStorage.getItem("UserID")
                                }, (ret) => {
                                    ret = JSON.parse(ret);
                                    if (ret.status == 200) {
                                        //获取总未读记录数
                                        
                                        for (var i = 0; i < ret.data.ds.length; i++) {
                                            //每条消息重新发送给当前用户
                                            let fs = friend.filter(item => item.id == ret.data.ds[i].FromUserID);
                                            if (fs.length > 0) {
                                                //接收消息
                                                layim.getMessage({
                                                    username: fs[0].username
                                                    , avatar: fs[0].avatar
                                                    , id: fs[0].id
                                                    , type: "friend" //聊天窗口来源类型，从发送消息传递的to里面获取
                                                    , content: ret.data.ds[i].Content
                                                    , cid: 0 //消息id，可不传。除非你要对消息进行一些操作（如撤回）
                                                    , mine: false //是否我发送的消息，如果为true，则会显示在右方
                                                    , fromid: fs[0].id //消息的发送者id（比如群组中的某个消息发送者），可用于自动解决浏览器多窗口时的一些问题
                                                    , timestamp: ret.data.ds[i].CreateTimeStamp * 1000 - 8 * 60 * 60 * 1000 //服务端时间戳毫秒数。注意：如果你返回的是标准的 unix 时间戳，记得要 *1000
                                                });
                                                document.getElementById('msg_mp3').play();
                                                ipcRenderer.send('twinkle')
                                            }
                                        }
                                        for (var i = 0; i < ret.data.ds1.length; i++) {
                                            let fs = friend.filter(item => item.id == ret.data.ds1[i].FromUserID);
                                            if (fs.length > 0) {
                                                //接收消息
                                                layim.getMessage({
                                                    username: fs[0].username
                                                    , avatar: fs[0].avatar
                                                    , id: ret.data.ds1[i].GroupID
                                                    , type: "group" //聊天窗口来源类型，从发送消息传递的to里面获取
                                                    , content: ret.data.ds1[i].Content
                                                    , cid: 0 //消息id，可不传。除非你要对消息进行一些操作（如撤回）
                                                    , mine: false //是否我发送的消息，如果为true，则会显示在右方
                                                    , fromid: fs[0].id //消息的发送者id（比如群组中的某个消息发送者），可用于自动解决浏览器多窗口时的一些问题
                                                    , timestamp: ret.data.ds1[i].CreateTimeStamp * 1000 - 8 * 60 * 60 * 1000 //服务端时间戳毫秒数。注意：如果你返回的是标准的 unix 时间戳，记得要 *1000
                                                });
                                                document.getElementById('msg_mp3').play();
                                                ipcRenderer.send('twinkle')
                                            }
                                        }
                                    }
                                });
                        }, 200);




                    } else {
                        layer.msg('接口数据异常!请稍后再试');
                    }
                }, (err) => {

                })
        });

        module.exports.showLayim = () => {
            $("#layui-layer100001").css({
                right: '0px',
                visibility: 'inherit'
            });
            $("#layui-layer100001").animate({ top: '40px' });
        }

        module.exports.hideLayim = () => {
            $("#layui-layer100001").css({
                top: '-521px',
                right: '0px',
                visibility: 'hidden'
            });
        }



        //截图功能
        var imgReader = function (item) {
            var blob = item.getAsFile(),
                reader = new FileReader();
            reader.onload = function (e) {
                imgSrc = e.target.result;
                // layer.confirm('是否要发送该截图?', { icon: 3, title: '发送截图' }, function (index) {

                // });
                post({
                    path: '/Frame/ST1_FLD/Handler.aspx?cmd=chatScreenShot'
                }, {
                        imageBase64Content: imgSrc
                    }, (ret) => {
                        ret = JSON.parse(ret);
                        if (ret.code == 0) {
                            $('.layim-chat-textarea textarea').val($('.layim-chat-textarea textarea').val() + 'img[' + ret.data.src + ']'); //这里注意要使用layim提供的内置标签哦
                            $(".layim-send-btn").click();
                        } else {
                            layer.alert(ret.msg);
                        }
                    });
            };

            reader.readAsDataURL(blob);
        };

        try {
            $('body').unbind('paste', ".layim-chat-textarea textarea").bind('paste', ".layim-chat-textarea textarea", function (e) {
                var clipboardData = event.clipboardData || window.clipboardData || event.originalEvent.clipboardData;
                var i = 0, items, item, types;
                if (clipboardData) {
                    items = clipboardData.items;
                    if (!items) {
                        return;
                    }
                    item = items[0];
                    types = clipboardData.types || [];
                    for (var i = 0; i < types.length; i++) {
                        if (types[i] === 'Files') {
                            item = items[i];
                            break;
                        }
                    }
                    if (item && item.kind === 'file' && item.type.match(/^image\//i)) {
                        imgReader(item);
                    }
                }
            });
        } catch (e) { console.log(e) }


    }
})()