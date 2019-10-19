const fs = require('fs')
const { ipcRenderer } = require('electron')
let cloudStorageServicesData = {}
const syncConfiguration = {}
const basename = require('basename')

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('source-folder-chooser').addEventListener('click', function () {
    openFile()
  })
  document.getElementById('sync-button').addEventListener('click', function () {
    syncFolder(syncConfiguration)
  })
})
function openFile () {
  ipcRenderer.send('openFolder', () => {
    console.log('Event sent.')
  })
}
ipcRenderer.on('folderData', (event, data) => {
  console.log(data)
  syncConfiguration.sourceFolder = data[0]
  document.getElementById('source-folder-path').innerHTML = syncConfiguration.sourceFolder
})

const insertCloudStorageServicesIntoSelect = function (cloudStorageServicesData) {
  // Get the select element
  const cloudStorageServiceSelectElement = document.getElementById('cloud-storage-service')

  for (const cloudStorageService of cloudStorageServicesData) {
    // Make a new option element
    const cloudStorageServiceOptionElement = document.createElement('option')

    // Set the attributes on the new option
    cloudStorageServiceOptionElement.innerHTML = cloudStorageService.name

    // Insert the new option element into the select element
    cloudStorageServiceSelectElement.appendChild(cloudStorageServiceOptionElement)
  }
}

// Load the list of supported cloud storage services
fs.promises.readFile('./cloudStorageServices.json', 'utf8')
  // Parse the JSON
  .then(function (cloudStorageServicesDataRaw) {
    return new Promise(function (resolve, reject) {
      try {
        // Parse the JSON string
        cloudStorageServicesData = JSON.parse(cloudStorageServicesDataRaw)
        return resolve(cloudStorageServicesData)
      } catch (e) {
        return reject(e)
      }
    })
  })
  // Update the user interface
  .then(function (cloudStorageServicesData) {
    return insertCloudStorageServicesIntoSelect(cloudStorageServicesData)
  })
  // Catch any errors
  .catch(function (error) {
    console.error(error)
    window.alert('MacDropAny encountered an error fetching the list of supported cloud storage services.')
  })

const syncFolder = function (syncConfiguration) {
// TODO: Validate inputs

  const folderName = basename(syncConfiguration.sourceFolder)

  fs.promises.rename(syncConfiguration.sourceFolder, syncConfiguration.defaultPath + '/' + folderName)
    .then(function () {
      window.alert('success')
    })
    .catch(function (err) {
      console.log(err)
      window.alert('err')
    })
}
