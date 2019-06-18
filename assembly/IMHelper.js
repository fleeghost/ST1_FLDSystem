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
    //更新用户ContextID
    let updateContextID = (contextID)=>{
        post({
            path: '/Frame/SqlData'
        }, {
                cmdname: 'updateUserContextID',
                userID: localStorage.getItem("UserID"),
                ContextID:contextID
            }, (ret) => {
            });
        
    }

    $.clientCallBacks={};
    //通讯Signalr
    let signalRHelper = () => {
        $.getScript("assets/jquery.signalR-2.4.1.min.js", function () {
            $.getScript("http://" + Config.Http_config.ip + ':' + Config.Http_config.port + "/signalr/hubs", function () {
                $.getScript("assets/signalr-mediate.js", function () {
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
                                method: function (userId,msg) {
                                    $.clientCallBacks["onChatMsg"](userId,msg);
                                }
                            }
                        ]
                    });
                    //socket连接
                    function signalrConnect() {
                        $.signalrApi.start(function () {
                            $.signalrApi.server.clientConnect();
                        });
                    }
                    signalrConnect();

                    setInterval(function () {

                        try {
                            $.signalrApi.server.clientLive();
                        } catch (e) {
                            $.signalrApi.start(function () {

                            });
                        }

                        if (new Date().getTime() - lockTime > 30 * 60 * 1000) {
                            vm.pageLock = true;
                        }

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
                            status: "online",
                            sign: userInfo.ds[0].Sign,
                            avatar: changeHeadImg(userInfo.ds[0].HeadImg)
                        };
                        var friendInfo = [{
                            "groupname": "福路德用户",
                            id: 1
                        }]
                        friend = [];
                        for (var i = 0; i < userInfo.ds1.length; i++) {
                            friend.push({
                                username: userInfo.ds1[i].UserName,
                                id: userInfo.ds1[i].UserID.toString(),
                                status: userInfo.ds1[i].ContextIDs ? "online" : 'offline',
                                sign: userInfo.ds1[i].Sign,
                                avatar: changeHeadImg(userInfo.ds1[i].HeadImg),
                                contextIDs: userInfo.ds1[i].ContextIDs
                            })
                        }
                        friendInfo[0].list = friend;
                        //signalR连接
                        $.clientCallBacks["onClientConnect"]=(contextID)=>{
                            mine["contextIDs"] = contextID;
                            updateContextID(contextID);
                        }
                        $.clientCallBacks["onChatMsg"]=(userId,msg,timestamp)=>{
                            let fs = friend.filter(item=>item.id==userId);
                            if(fs.length>0){
                                //接收消息
                                layim.getMessage({
                                    username: fs[0].username
                                    ,avatar: fs[0].avatar
                                    ,id: fs[0].id
                                    ,type: "friend" //聊天窗口来源类型，从发送消息传递的to里面获取
                                    ,content: msg
                                    ,cid: 0 //消息id，可不传。除非你要对消息进行一些操作（如撤回）
                                    ,mine: false //是否我发送的消息，如果为true，则会显示在右方
                                    ,fromid: fs[0].id //消息的发送者id（比如群组中的某个消息发送者），可用于自动解决浏览器多窗口时的一些问题
                                    ,timestamp: timestamp*1000 //服务端时间戳毫秒数。注意：如果你返回的是标准的 unix 时间戳，记得要 *1000
                                });
                            }
                        }
                        signalRHelper();
                        //基础配置
                        layim.config({
                            init: {
                                mine: mine
                                , friend: friendInfo
                                , group: []
                            }
                            //获取群员接口（返回的数据格式见下文）
                            , members: {
                                url: '/t.html' //接口地址（返回的数据格式见下文）
                                , type: 'get' //默认get，一般可不填
                                , data: {} //额外参数
                            }
                            //上传图片接口（返回的数据格式见下文），若不开启图片上传，剔除该项即可
                            , uploadImage: {
                                url: '' //接口地址
                                , type: 'post' //默认post
                            }
                            //上传文件接口（返回的数据格式见下文），若不开启文件上传，剔除该项即可
                            , uploadFile: {
                                url: '' //接口地址
                                , type: 'post' //默认post
                            }
                            //扩展工具栏，下文会做进一步介绍（如果无需扩展，剔除该项即可）
                            , tool: [{
                                alias: 'code' //工具别名
                                , title: '代码' //工具名称
                                , icon: '&#xe64e;' //工具图标，参考图标文档
                            }]
                            , msgbox: layui.cache.dir + 'css/modules/layim/html/msgbox.html' //消息盒子页面地址，若不开启，剔除该项即可
                            , find: layui.cache.dir + 'css/modules/layim/html/find.html' //发现页面地址，若不开启，剔除该项即可
                            , chatLog: layui.cache.dir + 'css/modules/layim/html/chatlog.html' //聊天记录页面地址，若不开启，剔除该项即可
                        });
                        //监听发送消息
                        layim.on('sendMessage', function(res){
                            let fromContextID = mine.contextIDs;
                            let userID = mine.id;
                            let toContextIDs = friend.filter(item => item.id==res.to.id)[0].contextIDs;
                            let msg = res.mine.content;
                            alert(fromContextID+'|'+userID+'|'+toContextIDs+'|'+msg);
                            $.signalrApi.server.chatMsg(fromContextID,userID,toContextIDs,msg);
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
    }
})()