const webview_ipc = require('electron');
$(function () {
    $('body').click(function () {
        webview_ipc.ipcRenderer.send('win_click');
    })
})