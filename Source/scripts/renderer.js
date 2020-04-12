const path = require('path')
const {
  ipcRenderer,
  shell
} = require('electron')
const syncConfiguration = {}
const strings = require('./../scripts/strings')
const syncer = require('./../scripts/syncer')
const basename = require('basename')

// Make jQuery global
let $ = function () {
  console.error('jQuery is not defined')
}

document.addEventListener('DOMContentLoaded', function () {
  // Save reference to jQuery
  $ = window.$

  // Attach event listeners
  $('#sync-button').click(syncStartHandler)
  $('.folder-chooser').click(chooseFolderClickHandler)
  manageDragAndDrop()
})

const syncStartHandler = function () {
  if (syncer.validateSyncConfiguration(syncConfiguration)) {
    ipcRenderer.send('syncFolder', syncConfiguration)
  }
}

const chooseFolderClickHandler = function (event) {
  const folderChooserID = $(event.target).closest('.folder-chooser').data('folder-chooser-id')
  chooseFolder(folderChooserID)
}

const folderChooserOptions = {
  source: {
    message: strings.get('choose-folder-source-message'),
    buttonLabel: strings.get('choose-folder-button-label'),
    defaultPath: require('os').homedir(),
    properties: ['openDirectory']
  },
  target: {
    message: strings.get('choose-folder-target-message'),
    buttonLabel: strings.get('choose-folder-button-label'),
    defaultPath: require('os').homedir(),
    properties: ['openDirectory']
  }
}

function chooseFolder (folderChooserID) {
  ipcRenderer.send('chooseFolder', folderChooserID, folderChooserOptions[folderChooserID])
}

ipcRenderer.on('folderChosen', (event, folderChooserID, paths) => {
  if (folderChooserID && paths && paths.length > 0) {
    // Extract the folder path and name
    const path = paths[0]
    const folderName = basename(path)

    // Save the folder path
    syncConfiguration[`${folderChooserID}Folder`] = path

    // Update the appearance and text of the relevant folder chooser element
    const folderChooserElement = $(`[data-folder-chooser-id="${folderChooserID}"]`)
    folderChooserElement.addClass('folder-chosen')

    folderChooserElement.find('.step-title').text(strings.get(`${folderChooserID}-folder-chooser-title-folder-chosen`, [folderName]))

    folderChooserElement.find('.step-subtitle').text(strings.get('step-subtitle-folder-selected'))

    updateSyncButton()
  }
})

const updateSyncButton = function () {
  const syncButton = $('#sync-button')
  const syncConfigurationValidity = syncer.validateSyncConfiguration(syncConfiguration)
  syncButton.toggleClass('disabled', !syncConfigurationValidity)

  if (syncConfiguration.sourceFolder && syncConfiguration.targetFolder) {
    syncButton.text(strings.get('sync-button-source-target', [basename(syncConfiguration.sourceFolder), basename(syncConfiguration.targetFolder)]))
  } else if (syncConfiguration.sourceFolder) {
    syncButton.text(strings.get('sync-button-source', [basename(syncConfiguration.sourceFolder)]))
  } else {
    syncButton.text(strings.get('sync-button'))
  }
}

ipcRenderer.on('syncCompleteDialogDismissHandler', (event, response, options) => {
  if (response && 'response' in response && response.response === 0 && options && options.targetFolderPath) {
    shell.showItemInFolder(options.targetFolderPath)
  }
  window.location.reload()
})

const syncComplete = function (event, options) {
  const sourceFolderName = basename(options.sourceFolder)
  const targetFolderName = basename(options.targetFolder)
  ipcRenderer.send('displayDialog', {
    message: strings.get('sync-complete-message', [sourceFolderName, targetFolderName]),
    detail: strings.get('sync-complete-detail', [sourceFolderName, targetFolderName, sourceFolderName, targetFolderName]),
    buttons: [strings.get('sync-complete-button-show-folder', [sourceFolderName, targetFolderName]), strings.get('close')],
    defaultId: 0,
    responseHandlerName: 'syncCompleteDialogDismissHandler',
    targetFolderPath: path.join(options.targetFolder, basename(options.sourceFolder))
  })
}
ipcRenderer.on('syncComplete', syncComplete)

const manageDragAndDrop = function () {
  document.ondragover = document.ondrop = (ev) => {
    ev.preventDefault()
  }

  $('.step-container').on('drag dragstart dragend dragover dragenter dragleave drop', function (e) {
    e.preventDefault()
    e.stopPropagation()
  }).on('dragover dragenter', function () {
    $(this).addClass('is-dragover')
  }).on('dragleave dragend drop', function () {
    $(this).removeClass('is-dragover')
  }).on('drop', function (e) {
    console.log(e.originalEvent.dataTransfer.files)
  })
}

ipcRenderer.on('darkModeStatus', function (event, data) {
  if (data && 'shouldUseDarkColors' in data) {
    if (data.shouldUseDarkColors) {
      $('body').addClass('dark-mode')
    } else {
      $('body').removeClass('dark-mode')
    }
  }
  console.log(data.msg)
})
