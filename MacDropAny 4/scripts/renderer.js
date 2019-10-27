// const fs = require('fs')
const path = require('path')
const {
  ipcRenderer,
  shell
} = require('electron')
// let cloudStorageServicesData = {}
const syncConfiguration = {}
const strings = require('./../scripts/strings')
const basename = require('basename')

// const cloudStorageServicesDataPath = '../configurations/cloudStorageServices.json'

document.addEventListener('DOMContentLoaded', function() {
  // document.getElementById('source-folder-chooser').addEventListener('click', chooseFolderClickHandler)
  window.$('#sync-button').click(syncStartHandler)
  window.$('.folder-chooser').click(chooseFolderClickHandler)
})

const syncStartHandler = function() {
  // do some input verification
  ipcRenderer.send('syncFolder', syncConfiguration)
}

const chooseFolderClickHandler = function(event) {
  const folderChooserID = window.$(event.target).data('folder-chooser-id')
  chooseFolder(folderChooserID)
}

const folderChooserOptions = {
  source: {
    message: strings.getString('Choose a folder to sync with the cloud'),
    buttonLabel: strings.getString('Choose Folder'),
    defaultPath: require('os').homedir(),
    properties: ['openDirectory']
  },
  target: {
    message: strings.getString('Choose where in the cloud to sync this folder'),
    buttonLabel: strings.getString('Choose Folder'),
    defaultPath: require('os').homedir(),
    properties: ['openDirectory']
  }
}

function chooseFolder(folderChooserID) {
  ipcRenderer.send('chooseFolder', folderChooserID, folderChooserOptions[folderChooserID])
}

ipcRenderer.on('folderChosen', (event, folderChooserID, paths) => {
  if (folderChooserID && paths && paths.length > 0) {
    const path = paths[0]
    switch (folderChooserID) {
      case 'source':
        syncConfiguration.sourceFolder = path
        document.getElementById('source-folder-path').innerHTML = path
        break
      case 'target':
        syncConfiguration.targetFolder = path
        document.getElementById('target-folder-path').innerHTML = path
        break
      default:
    }
  }
})

ipcRenderer.on('syncCompleteDialogDismissHandler', (event, response, options) => {
  if (response && 'response' in response && response.response === 1 && options && options.targetFolderPath) {
    shell.showItemInFolder(options.targetFolderPath)
  }
})

const syncComplete = function(event, options) {
  console.log(options)
  const sourceFolderName = basename(options.sourceFolder)
  const targetFolderName = basename(options.targetFolder)
  ipcRenderer.send('displayDialog', {
    message: strings.getString('$0 succesfully synced with $1', [sourceFolderName, targetFolderName]),
    detail: strings.getString('MacDropAny succesfully synced $0 with $1. Any changes to $2 will now automatically be reflected in $3', [sourceFolderName, targetFolderName, sourceFolderName, targetFolderName]),
    buttons: [strings.getString('Show $0 in $1', [sourceFolderName, targetFolderName]), strings.getString('Close')],
    defaultId: 0,
    responseHandlerName: 'syncCompleteDialogDismissHandler',
    targetFolderPath: path.join(options.targetFolder, basename(options.sourceFolder))
  })
}
ipcRenderer.on('syncComplete', syncComplete)
