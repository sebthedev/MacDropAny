// const fs = require('fs')
const path = require('path')
const {
  ipcRenderer,
  shell
} = require('electron')
const syncConfiguration = {}
const strings = require('./../scripts/strings')
const basename = require('basename')

document.addEventListener('DOMContentLoaded', function () {
  window.$('#sync-button').click(syncStartHandler)
  window.$('.folder-chooser').click(chooseFolderClickHandler)
})

const syncStartHandler = function () {
  // do some input verification
  ipcRenderer.send('syncFolder', syncConfiguration)
}

const chooseFolderClickHandler = function (event) {
  const folderChooserID = window.$(event.target).closest('[data-folder-chooser-id]').data('folder-chooser-id')
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

function chooseFolder (folderChooserID) {
  ipcRenderer.send('chooseFolder', folderChooserID, folderChooserOptions[folderChooserID])
}

ipcRenderer.on('folderChosen', (event, folderChooserID, paths) => {
  console.log('folderChosen event', folderChooserID)
  if (folderChooserID && paths && paths.length > 0) {
    const path = paths[0]
    console.log(path)
    switch (folderChooserID) {
      case 'source':
        syncConfiguration.sourceFolder = path
        window.$('[data-folder-chooser-id="source"] .step-title').text(strings.getString('Folder to Sync: SourceFolderName', [basename(path)]))
        break
      case 'target':
        syncConfiguration.targetFolder = path
        window.$('[data-folder-chooser-id="target"] .step-title').text(strings.getString('Cloud Folder to Sync with: TargetFolderName', [basename(path)]))
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

const syncComplete = function (event, options) {
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

window.$(document).ready(function () {
  document.ondragover = document.ondrop = (ev) => {
    ev.preventDefault()
  }

  window.$('.step-container').on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
    e.preventDefault()
    e.stopPropagation()
  }).on('dragover dragenter', function () {
    window.$(this).addClass('is-dragover')
  }).on('dragleave dragend drop', function () {
    window.$(this).removeClass('is-dragover')
  }).on('drop', function (e) {
    console.log(e.originalEvent.dataTransfer.files)
  })
})

ipcRenderer.on('darkModeStatus', function (event, data) {
  if (data && 'shouldUseDarkColors' in data) {
    if (data.shouldUseDarkColors) {
      window.$('body').addClass('dark-mode')
    } else {
      window.$('body').removeClass('dark-mode')
    }
  }
  console.log(data.msg)
})
