const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const basename = require('basename')
const path = require('path')
const strings = require('./strings')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    backgroundColor: '#F96167', //, #FCE77D,
    titleBarStyle: 'hiddenInset'
  })

  // and load the index.html of the app.
  win.loadFile('../views/index.html')

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
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

ipcMain.on('syncFolder', (event, options) => {
  console.log(options)
  // TODO: validate options

  const sourcePath = options.sourceFolder
  const targetPath = path.join(options.targetFolder, basename(options.sourceFolder))

  fs.promises.rename(sourcePath, targetPath)
    .then(function () {
      console.log('Rename complete!')

      return fs.promises.symlink(targetPath, sourcePath)
    })
    .then(function () {
      console.log('Symlink complete!')
      event.sender.send('syncComplete')
    })
    .catch(function (err) {
      console.log(err)
      return displayDialog({
        type: 'error',
        message: 'An error occured while syncing the folder',
        detail: strings.getString('MacDropAny was unable to sync the folder $0 with $1.\n\nError details: $2', [
          basename(sourcePath),
          basename(targetPath),
          err.message
        ])
      })
    })

  // fs.rename(sourcePath, targetPath, (err) => {
  //   if (err) {
  //     console.log(err)
  //     return displayDialog({
  //       type: 'error',
  //       message: 'An error occured while syncing the folder',
  //       detail: strings.getString('MacDropAny was unable to sync the folder $0 with $1.\n\nError details: $2', [
  //         basename(sourcePath),
  //         basename(targetPath),
  //         err.message
  //       ])
  //     })
  //   }
  // })
})

const displayDialog = function (options) {
  dialog.showMessageBox(win, options)
}

ipcMain.on('chooseFolder', (event, folderChooserID, options) => {
  dialog.showOpenDialog(win, options, paths => event.sender.send('folderChosen', folderChooserID, paths))
})
