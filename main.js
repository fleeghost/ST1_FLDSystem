const { SystemModules, SelfModules } = require('./assembly/RequireHelper')
const electron = SystemModules('electron');
const colors = require('colors');
const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, session, ipcMain, ipcRenderer } = electron
const path = SystemModules('path');
const url = SystemModules('url');
const { RewriteUrl } = SelfModules('urlRewriter')
const { writeFile, readFile } = SelfModules('fileHelper');
const Config = require('./config/config.json');
const { dialog } = require('electron')
const nodeCmd = require('node-cmd');
const fs = require('fs')
const { downFile } = SelfModules('downLoadFileHelper')


colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'red',
  info: 'green',
  data: 'blue',
  help: 'cyan',
  warn: 'yellow',
  debug: 'magenta',
  error: 'red'
})




let winLogin, winMain

//系统内存变量
//登录用户信息
let currentUser;
//禁用的业务流权限
let unWorkRole = [];
//表单权限列表
let billRole = [];
//是否清除远程localstorge
let isClearGlobalLocalStorge = false;
//更新程序下载数量
let updateProgramDownloadCount = 0;


function createWindow() {


  //请求前事件
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    try {
      let originUrl = RewriteUrl(details.url);
      callback({ cancel: false, originUrl });
    }
    catch (e) {
      console.log(details);
    }
  })

  winLogin = new BrowserWindow({
    width: 526,
    height: 470,
    maximizable: false,
    center: true,
    autoHideMenuBar: true,
    resizable: false,
    frame: false,
    transparent: true,
    icon: __dirname + '/app/image/logo_ico.png'
  })

  winLogin.loadURL(url.format({
    pathname: path.join(__dirname, "/app/login.html"),
    protocol: 'file:',
    slashes: true
  }))
  //winLogin.webContents.openDevTools()

  winLogin.on('closed', () => {
    winLogin = null
  })
  moduleFunction()

  //运行进程
  //nodeCmd.run('start D:\\汇智云创\\福路德信息化平台\\Program\\ST1_FLDSystem\\build\\win-unpacked\\ST1系统更新程序.exe');

}


const gotTheLock = app.requestSingleInstanceLock();
if (gotTheLock) {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (winLogin) {
      if (winLogin.isMinimized()) winLogin.restore()
      winLogin.focus()
    } else if (winMain) {
      if (winMain.isMinimized()) winMain.restore()
      winMain.focus()
    }
  })
  app.on('ready', createWindow)
} else {
  app.quit();
}



app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

//模块方法
let moduleFunction = () => {
  //页面请求函数
  //获取页面根目录
  ipcMain.on('getRootPath', (e, arg) => {
    e.returnValue = __dirname
  })
  //保存用户信息
  ipcMain.on('getCurrentUser', (e, arg) => {
    e.returnValue = currentUser
  })
  //设置用户信息
  ipcMain.on('setCurrentUser', (e, arg) => {
    currentUser = arg.userInfo;
    //存储用户信息到本地
    writeFile(arg.path, JSON.stringify(currentUser));
  })
  //跳转到主页
  ipcMain.on('redirectMain', (e, arg) => {

    winMain = new BrowserWindow({
      width: 1366,
      height: 768,
      minWidth: 1366,
      minHeight: 768,
      center: true,
      autoHideMenuBar: true,
      resizable: true,
      frame: false,
      transparent: true,
      icon: __dirname + '/app/image/logo_ico.png'
    });
    winMain.loadURL(url.format({
      pathname: path.join(__dirname, "/app/index.html"),
      protocol: 'file:',
      slashes: true
    }));
    winMain.maximize();
    winMain.on('closed', () => {
      winMain = null
    })
    //关闭登录页面
    winLogin.close();

    //winMain.webContents.openDevTools()
  })
  //跳转到登录
  ipcMain.on('redirectLogin', (e, arg) => {
    winLogin = new BrowserWindow({
      width: 526,
      height: 470,
      maximizable: false,
      center: true,
      autoHideMenuBar: true,
      resizable: false,
      frame: false,
      transparent: true
    })
    winLogin.loadURL(url.format({
      pathname: path.join(__dirname, "/app/login.html"),
      protocol: 'file:',
      slashes: true
    }))
    winLogin.on('closed', () => {
      winLogin = null
    })
    winMain.close();
  })
  //关闭软件
  ipcMain.on('quitApp', (e, arg) => {
    app.exit(0)
  })
  //软件最小化
  ipcMain.on('minWindow', (e, arg) => {
    if (winLogin != null) {
      winLogin.minimize();
    }
    else if (winMain != null) {
      winMain.minimize();
    }
  });

  ipcMain.on('toggleWindow_min', (e, arg) => {
    if (winMain != null) {
      winMain.setSize(1366, 768);
      winMain.center();
    }
    else {
      winLogin.setSize(1366, 768);
      winLogin.center();
    }
  })

  ipcMain.on('toggleWindow_max', (e, arg) => {
    if (winMain != null) {
      const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
      winMain.setSize(width, height);
      winMain.center();
    }
    else {
      const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
      winLogin.setSize(width, height);
      winLogin.center();
    }
  })

  ipcMain.on('openTool', (e, arg) => {
    if (winMain != null) {
      winMain.webContents.openDevTools();
    }
  })

  //接收错误信息
  ipcMain.on('webviewError', (e, arg) => {
    if (winMain != null) {
      winMain.webContents.send('errorWrite', arg);
    }
  })

  ipcMain.on('webviewClick', (e, arg) => {
    if (winMain != null) {
      winMain.webContents.send('appClick');
    }
  })

  //更新业务权限功能模块
  ipcMain.on('setUnWrokRoleList', (e, arg) => {
    unWorkRole = arg;
  })
  //获取业务禁用权限功能模块
  ipcMain.on('getUnWorkRoleList', (e, arg) => {
    let mainModuleName = arg.mainModuleName;
    let childModuleName = arg.childModuleName;
    e.returnValue = unWorkRole.filter(item => item.ModuleName == mainModuleName && item.ChildModuleNo == childModuleName);
  })
  //更新表单功能权限
  ipcMain.on('setBillRoleList', (e, arg) => {
    billRole = arg;
  })
  //获取表单权限列表
  ipcMain.on('getBillRoleList', (e, arg) => {
    let filterSQL = "";
    let moduleName = arg.moduleName;
    let billList = billRole.filter(item => item.FListName == moduleName);
    if (billList.length > 0) {
      if (billList[0]["T_Value"] != '-1') {
        filterSQL += '(';
        //权限业务逻辑
        let colTypes = [];//已执行过的类型列
        let colSQLType = [];//多类型SQL集合
        billList.forEach(item => {
          if (item["SC_ColA"]) {
            if (colTypes.filter(x => x == item["SC_ColA"]).length == 0) {
              let sc_colAs = [];
              let sc_colBs = [];
              let current_filterSQL = "";
              let current_billType = billList.filter(x => x["SC_ColA"] == item["SC_ColA"]);
              for (var i = 0; i < current_billType.length; i++) {
                sc_colAs.push("'" + current_billType[i]["T_Value"] + "'");
                if (current_billType[i]["SC_ColB"]) {
                  sc_colBs.push("'" + current_billType[i]["T_Value"] + "'");
                }
              }
              if (sc_colAs.length > 0) {
                current_filterSQL += ' ' + item["SC_ColA"] + " in (" + sc_colAs.join(",") + ")"
                if (sc_colBs.length > 0) {
                  current_filterSQL += " or " + current_billType[0]["SC_ColB"] + " in (" + sc_colBs.join(",") + ") "
                }
              }
              if (current_filterSQL) {
                current_filterSQL = " (" + current_filterSQL + ") ";
                colSQLType.push(current_filterSQL);
              }
              colTypes.push(item["SC_ColA"]);
            }
          }
        })
        filterSQL += colSQLType.join(" and ");
        filterSQL += " ) "
      }
    }
    e.returnValue = filterSQL;
  })
  //清除远程localstorge值
  ipcMain.on('clearGlobalLocalstorge', (e, arg) => {
    if (isClearGlobalLocalStorge) {
      e.returnValue = false;
    }
    else {
      isClearGlobalLocalStorge = true;
      e.returnValue = true;
    }
  })
  //添加main上的tab页签
  ipcMain.on('addMainTab', (e, arg) => {
    winMain.webContents.send('addMainTab', {
      Id: arg.Id,
      Name: arg.Name,
      NavigateUrl: arg.NavigateUrl
    });
  })
  //消息提醒
  ipcMain.on('messageBox', (e, arg) => {
    winMain.webContents.send('messageBox', arg);
  })


  ipcMain.on('twinkle', (e, arg) => {
    winMain.once('focus', () => winMain.flashFrame(false))
    winMain.flashFrame(true)
  })
}

//检测更新程序是否存在安装目录下
ipcMain.on("checkUpdateProgram", (e, arg) => {
  updateProgramDownloadCount = 0;
  let programPath = process.cwd() + "\\ST1系统更新程序.exe";
  fs.access(programPath, fs.constants.F_OK, (err) => {
    if (err) {
      //不存在该目录，则去服务器下载
      downFile({
        remoteFile: encodeURI('http://' + Config.Http_config.ip + ':' + Config.Http_config.port + "/download/updateprogram/ST1系统更新程序.exe"),
        localFile: process.cwd() + "\\ST1系统更新程序.exe",
        onProgress: function (received, total) {
          var percentage = (received * 100) / total;
          if (percentage >= 100) {
            updateProgramDownloadCount++;
          }
        }
      })
    }
    else {
      updateProgramDownloadCount++;
    }
  });

  let programPath2 = process.cwd() + "\\ICSharpCode.SharpZipLib.dll";
  fs.access(programPath2, fs.constants.F_OK, (err) => {
    if (err) {
      //不存在该目录，则去服务器下载
      downFile({
        remoteFile: 'http://' + Config.Http_config.ip + ':' + Config.Http_config.port + "/download/updateprogram/ICSharpCode.SharpZipLib.dll",
        localFile: process.cwd() + "\\ICSharpCode.SharpZipLib.dll",
        onProgress: function (received, total) {
          var percentage = (received * 100) / total;
          if (percentage >= 100) {
            updateProgramDownloadCount++;
          }
        }
      })
    }
    else {
      updateProgramDownloadCount++;
    }
  });

  let programPath3 = process.cwd() + "\\ProgressODoom.dll";
  fs.access(programPath3, fs.constants.F_OK, (err) => {
    if (err) {
      //不存在该目录，则去服务器下载
      downFile({
        remoteFile: 'http://' + Config.Http_config.ip + ':' + Config.Http_config.port + "/download/updateprogram/ProgressODoom.dll",
        localFile: process.cwd() + "\\ProgressODoom.dll",
        onProgress: function (received, total) {
          var percentage = (received * 100) / total;
          if (percentage >= 100) {
            updateProgramDownloadCount++;
          }
        }
      })
    }
    else {
      updateProgramDownloadCount++;
    }
  });
})

//软件更新检测程序

//let updateType = 1;

ipcMain.on('update', (e, arg) => {
  // updateType = arg;
  // updateHandle();
  if (updateProgramDownloadCount == 3) {
    let updateFeedUrl = "";
    if (process.arch == 'x64') {
      updateFeedUrl = 'http://' + Config.Http_config.ip + ':' + Config.Http_config.port + '/download/win/64/';
    } else {
      updateFeedUrl = 'http://' + Config.Http_config.ip + ':' + Config.Http_config.port + '/download/win/32/';
    }
    updateFeedUrl += arg + "/update.zip";
    //更新ini文件配置信息
    fs.writeFile(path.join(process.cwd(), "\\update.ini"), Config.processName + ',' + updateFeedUrl, 'utf8', function () {
      //运行进程
      nodeCmd.run('start ' + process.cwd() + '\\ST1系统更新程序.exe');
    });
  }
})

// // 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
// function updateHandle() {
//   let message = {
//     error: '检查更新出错',
//     checking: '检查更新中',
//     updateAva: '正在下载新版本',
//     updateNotAva: '现在已是最新版本',
//   };

//   //如下应用程序的路径请自行替换成自己应用程序的路径
//   let updateFeedUrl = 'http://' + Config.Http_config.ip + ':' + Config.Http_config.port + '/download/win/32/';

//   if (process.arch == 'x64') {
//     updateFeedUrl = 'http://' + Config.Http_config.ip + ':' + Config.Http_config.port + '/download/win/64/';
//   } else {
//     updateFeedUrl = 'http://' + Config.Http_config.ip + ':' + Config.Http_config.port + '/download/win/32/';
//   }

//   autoUpdater.setFeedURL(updateFeedUrl);
//   autoUpdater.on('error', function (error) {
//     sendUpdateMessage(message.error)
//   });
//   autoUpdater.on('checking-for-update', function () {
//     sendUpdateMessage(message.checking)
//   });
//   autoUpdater.on('update-available', function (info) {
//     sendUpdateMessage(message.updateAva)
//   });
//   autoUpdater.on('update-not-available', function (info) {
//     sendUpdateMessage(message.updateNotAva)
//   });

//   // 更新下载进度事件
//   autoUpdater.on('download-progress', function (progressObj) {
//     if (updateType == 1) {
//       winLogin.webContents.send('downloadProgress', progressObj)
//     } else {
//       winMain.webContents.send('downloadProgress', progressObj)
//     }

//   })
//   autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
//     sendUpdateMessage('isUpdateNow');
//     ipcMain.on('updateNow', (e, arg) => {
//       autoUpdater.quitAndInstall();
//     })
//   });

//   //some code here to handle event
//   autoUpdater.checkForUpdates();
// }

// // 通过main进程发送事件给renderer进程，提示更新信息
// function sendUpdateMessage(text) {
//   if (updateType == 1) {
//     winLogin.webContents.send('message', text)
//   } else {
//     winMain.webContents.send('message', text)
//   }

// }



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.