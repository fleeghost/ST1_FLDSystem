const { SystemModules, SelfModules } = require('./assembly/RequireHelper')
const electron = SystemModules('electron');
const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, session, ipcMain, ipcRenderer } = electron
const path = SystemModules('path');
const url = SystemModules('url');
const { RewriteUrl } = SelfModules('urlRewriter')
const { writeFile, readFile } = SelfModules('fileHelper');
const Config = require('./config/config.json');





// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let winLogin, winMain

//系统内存变量
let currentUser


function createWindow() {

  // console.log(session.defaultSession.cookies)


  //请求前事件
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    try {
      let originUrl = RewriteUrl(details.url);
      // console.log(originUrl + '-------');
      callback({ cancel: false, originUrl });
    }
    catch (e) {
      console.log(details);
    }
  })

  // Create the browser window.
  // const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
  winLogin = new BrowserWindow({
    width: 526,
    height: 470,
    maximizable: false,
    center: true,
    autoHideMenuBar: true,
    resizable: false,
    frame: false,
    transparent: true,
    icon: __dirname + '/app/image/logo.png'
  })

  // and load the index.html of the app.
  // win.loadURL(url.format({
  //   pathname: '/app/login.html',
  //   protocol: 'file:',
  //   slashes: true
  // }))

  winLogin.loadURL(url.format({
    //pathname: "/app/login.html",
    pathname: path.join(__dirname, "/app/login.html"),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // winLogin.webContents.openDevTools()

  // Emitted when the window is closed.
  winLogin.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    winLogin = null
  })
  moduleFunction()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
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
      icon: __dirname + '/app/image/logo.png'
    });
    winMain.loadURL(url.format({
      pathname: path.join(__dirname, "/app/index.html"),
      protocol: 'file:',
      slashes: true
    }));
    winMain.maximize();
    winMain.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      winMain = null
    })
    //关闭登录页面
    winLogin.close();

    // winMain.webContents.openDevTools()
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
    app.quit();
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
  //软件最大化
  ipcMain.on('maxWindow', (e, arg) => {
    if (winMain != null) {
      winMain.maximize();
    }
  });
  //取消软件最大化
  ipcMain.on('unMaxWindow', (e, arg) => {
    if (winMain != null) {
      winMain.unmaximize();
    }
  })

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


}


ipcMain.on('update', (e, arg) => {
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
  let updateFeedUrl = 'http://'+Config.Http_config.ip+':'+Config.Http_config.port+'/download/win/';
  if (process.platform == 'darwin') {
    updateFeedUrl = 'http://'+Config.Http_config.ip+':'+Config.Http_config.port+'/download/mac/';
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
    winLogin.webContents.send('downloadProgress', progressObj)
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
  winLogin.webContents.send('message', text)
}



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.