// const fs = require('fs')
// const path = require('path')
const { ipcRenderer } = require('electron')
// let cloudStorageServicesData = {}
const syncConfiguration = {}
const strings = require('./../scripts/strings')

// const cloudStorageServicesDataPath = '../configurations/cloudStorageServices.json'

document.addEventListener('DOMContentLoaded', function () {
  // document.getElementById('source-folder-chooser').addEventListener('click', chooseFolderClickHandler)
  window.$('#sync-button').click(syncStartHandler)
  window.$('.folder-chooser').click(chooseFolderClickHandler)
})

const syncStartHandler = function () {
  // do some input verification
  ipcRenderer.send('syncFolder', syncConfiguration)
}

const chooseFolderClickHandler = function (event) {
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

function chooseFolder (folderChooserID) {
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

// const insertCloudStorageServicesIntoSelect = function (cloudStorageServicesData) {
//   // Get the select element
//   const cloudStorageServiceSelectElement = document.getElementById('cloud-storage-service')
//
//   for (const cloudStorageService of cloudStorageServicesData) {
//     // Make a new option element
//     const cloudStorageServiceOptionElement = document.createElement('option')
//
//     // Set the attributes on the new option
//     cloudStorageServiceOptionElement.innerHTML = cloudStorageService.name
//
//     // Insert the new option element into the select element
//     cloudStorageServiceSelectElement.appendChild(cloudStorageServiceOptionElement)
//   }
// }

// Load the list of supported cloud storage services

// const localeStringsPath = path.join(__dirname, '../strings/' + app.getLocale() + '.json')
// if (fs.existsSync(localeStringsPath)) {
//   return JSON.parse(fs.readFileSync(localeStringsPath, 'utf8'))
// } else {
//   return JSON.parse(fs.readFileSync(path.join(__dirname, '../strings/en.json'), 'utf8'))
// }

// fs.promises.readFile(cloudStorageServicesDataPath, 'utf8')
// fs.promises.readFile(path.join(__dirname, '../configurations/cloudStorageServices.json'), 'utf8')
//   // Parse the JSON
//   .then(function (cloudStorageServicesDataRaw) {
//     return new Promise(function (resolve, reject) {
//       try {
//         // Parse the JSON string
//         cloudStorageServicesData = JSON.parse(cloudStorageServicesDataRaw)
//         return resolve(cloudStorageServicesData)
//       } catch (e) {
//         return reject(e)
//       }
//     })
//   })
//   // Update the user interface
//   .then(function (cloudStorageServicesData) {
//     return insertCloudStorageServicesIntoSelect(cloudStorageServicesData)
//   })
//   // Catch any errors
//   .catch(function (error) {
//     console.error(error)
//     window.alert('MacDropAny encountered an error fetching the list of supported cloud storage services.')
//   })

// const syncFolder = function (syncConfiguration) {
// // TODO: Validate inputs
//
//   const folderName = basename(syncConfiguration.sourceFolder)
//
//   fs.promises.rename(syncConfiguration.sourceFolder, syncConfiguration.defaultPath + '/' + folderName)
//     .then(function () {
//       window.alert('success')
//     })
//     .catch(function (err) {
//       console.log(err)
//       window.alert('err')
//     })
// }
