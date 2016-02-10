'use strict';
const electron = require('electron');
const fs = require('fs');
const app = electron.app;
const ipc = electron.ipcMain;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function openWindow () {
  // Create the browser window.
  if(typeof mainWindow != 'object') {
    mainWindow = new BrowserWindow({width: 400, height: 500, resizable: false, frame: false, backgroundColor: '#000', darkTheme: true});

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');
  }
  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
  });

}

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform != 'darwin') {
  //   app.quit();
  // }
  app.quit();
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.

app.on('ready', openWindow);

app.on('activate', openWindow);


ipc.on('close-window', function(event, arg) {
  console.log(arg);  // prints "ping"
  mainWindow.close();
  event.returnValue = 'pong';
});
