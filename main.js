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

console.info(colors.info(__dirname));


let winLogin, winMain

//系统内存变量
//登录用户信息
let currentUser;
//禁用的业务流权限
let unWorkRole=[];
//是否清除远程localstorge
let isClearGlobalLocalStorge = false;


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

  winLogin.on('closed', () => {
    winLogin = null
  })
  moduleFunction()
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
  })

  ipcMain.on('toggleWindow_max', (e, arg) => {
    if (winMain != null) {
      const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
      winMain.setSize(width, height);
      winMain.center();
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
  ipcMain.on('setUnWrokRoleList',(e,arg)=>{
      unWorkRole = arg;
  })
  //获取业务禁用权限功能模块
  ipcMain.on('getUnWorkRoleList',(e,arg)=>{
    let mainModuleName = arg.mainModuleName;
    let childModuleName = arg.childModuleName;
    e.returnValue = unWorkRole.filter(item=>item.ModuleName==mainModuleName && item.ChildModuleNo==childModuleName);
  })
  //清除远程localstorge值
  ipcMain.on('clearGlobalLocalstorge',(e,arg)=>{
        if(isClearGlobalLocalStorge){
          e.returnValue = false;
        }
        else{
          isClearGlobalLocalStorge = true;
          e.returnValue = true;
        }
  })
}







let updateType = 1;

ipcMain.on('update', (e, arg) => {
  updateType = arg;
  updateHandle();
})

// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
function updateHandle() {
  let message = {
    error: '检查更新出错',
    checking: '检查更新中',
    updateAva: '正在下载新版本',
    updateNotAva: '现在已是最新版本',
  };

  //如下应用程序的路径请自行替换成自己应用程序的路径
  let updateFeedUrl = 'http://' + Config.Http_config.ip + ':' + Config.Http_config.port + '/download/win/';
  if (process.platform == 'darwin') {
    updateFeedUrl = 'http://' + Config.Http_config.ip + ':' + Config.Http_config.port + '/download/mac/';
  }

  autoUpdater.setFeedURL(updateFeedUrl);
  autoUpdater.on('error', function (error) {
    sendUpdateMessage(message.error)
  });
  autoUpdater.on('checking-for-update', function () {
    sendUpdateMessage(message.checking)
  });
  autoUpdater.on('update-available', function (info) {
    sendUpdateMessage(message.updateAva)
  });
  autoUpdater.on('update-not-available', function (info) {
    sendUpdateMessage(message.updateNotAva)
  });

  // 更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    if (updateType == 1) {
      winLogin.webContents.send('downloadProgress', progressObj)
    } else {
      winMain.webContents.send('downloadProgress', progressObj)
    }

  })
  autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
    sendUpdateMessage('isUpdateNow');
    ipcMain.on('updateNow', (e, arg) => {
      autoUpdater.quitAndInstall();
    })
  });

  //some code here to handle event
  autoUpdater.checkForUpdates();
}

// 通过main进程发送事件给renderer进程，提示更新信息
function sendUpdateMessage(text) {
  if (updateType == 1) {
    winLogin.webContents.send('message', text)
  } else {
    winMain.webContents.send('message', text)
  }

}



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.