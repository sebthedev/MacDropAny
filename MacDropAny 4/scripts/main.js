const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const basename = require('basename')
const path = require('path')

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

// const fs = require('fs')
// fs.rename('/Users/sebthedev/Desktop', '/Users/sebthedev/Desktop2', (err) => {
//   if (err) throw err
//   console.log('Rename complete!')
// })

ipcMain.on('syncFolder', (event, options) => {
  console.log(options)
  // TODO: validate options
  fs.rename(options.sourceFolder, path.join(options.targetFolder, basename(options.sourceFolder)), (err) => {
    if (err) throw err
    console.log('Rename complete!')
  })
})

ipcMain.on('chooseFolder', (event, folderChooserID, options) => {
  const { dialog } = require('electron')
  console.log(options)

  dialog.showOpenDialog(win, options, paths => event.sender.send('folderChosen', folderChooserID, paths))
})
