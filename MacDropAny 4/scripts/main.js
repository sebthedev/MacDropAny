console.log('started app macdropany')
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeTheme
} = require('electron')
const fs = require('fs')
const basename = require('basename')
const path = require('path')
const strings = require('./strings')
const cmd = require('node-cmd')
// const updater = require('update-electron-app')

// Run Updater
// updater()

// Keep a global reference of the window object
let win

const createWindow = function () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 600,
    height: 350,
    webPreferences: {
      nodeIntegration: true
    },
    backgroundColor: '#F96167',
    titleBarStyle: 'hiddenInset',
    show: false,
    resizable: false,
    title: 'MacDropAny',
    fullscreenable: false
  })

  win.once('ready-to-show', () => {
    sendDarkModeStatus()
    win.show()
  })

  // and load the index.html of the app.
  const viewPath = path.resolve(__dirname, '../views/index.html')
  win.loadFile(viewPath)

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

app.on('ready', function () {
  require('./menu')
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') {
  app.quit()
  // }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

const editACLs = function (sourcePath) {
  return new Promise(function (resolve, reject) {
    cmd.get(`chmod -a "group:everyone deny delete" "${sourcePath}"`, function (err, data, stderr) {
      if (err) {
        console.log(err)
      }
      resolve()
    })
  })
}

ipcMain.on('syncFolder', (event, options) => {
  console.log(options)
  // TODO: validate options

  const sourcePath = options.sourceFolder
  const targetPath = path.join(options.targetFolder, basename(options.sourceFolder))

  editACLs(sourcePath)
    .then(function () {
      return fs.promises.rename(sourcePath, targetPath)
    })
    .then(function () {
      console.log('Rename complete!')

      return fs.promises.symlink(targetPath, sourcePath)
    })
    .then(function () {
      console.log('Symlink complete!')
      event.sender.send('syncComplete', options)
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
})

ipcMain.on('displayDialog', (event, options) => {
  options.event = event
  displayDialog(options)
})

const displayDialog = function (options) {
  dialog.showMessageBox(win, options)
    .then((response) => {
      if (options && options.event && options.responseHandlerName) {
        options.event.reply(options.responseHandlerName, response, options)
      }
    })
}

ipcMain.on('chooseFolder', (event, folderChooserID, options) => {
  dialog.showOpenDialog(win, options).then(result => {
    console.log('choseFolder: ', result.filePaths)
    event.reply('folderChosen', folderChooserID, result.filePaths)
  })
})

const sendDarkModeStatus = function () {
  win.webContents.send('darkModeStatus', {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors
  })
}
nativeTheme.on('updated', sendDarkModeStatus)

app.setAboutPanelOptions({
  credits: 'MacDropAny is built with care and dedication by Sebastian Hallum Clarke.\n\nThank you to the many generous supporters who have contributed their time, resources, and effort to improve MacDropAny.\n\nThanks to the Goose for her support.'
})