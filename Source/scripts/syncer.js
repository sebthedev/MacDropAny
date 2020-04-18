const fs = require('fs')
const basename = require('basename')

const syncConfigurationErrors = {
  SOURCE_FOLDER_NOT_DEFINED: 'source-folder-not-defined',
  TARGET_FOLDER_NOT_DEFINED: 'target-folder-not-defined',
  SOURCE_AND_TARGET_ARE_SAME: 'source-and-target-are-same',
  SOURCE_FOLDER_CONTAINS_TARGET_FOLDER: 'source-folder-contains-target-folder',
  ITEM_ALREADY_EXISTS_IN_TARGET_WITH_SAME_NAME_AS_SOURCE_FOLDER: 'item-already-exists-in-target-with-same-name-as-source-folder'
}

const validateSyncConfiguration = function (config) {
  // console.log('Validating the sync configuration:')
  // console.log(config)

  // Ensure the source folder parameter is set
  if (!config.sourceFolder) {
    return {
      valid: false,
      error: syncConfigurationErrors.SOURCE_FOLDER_NOT_DEFINED
    }
  }

  // Ensure the target folder parameter is set
  if (!config.targetFolder) {
    return {
      valid: false,
      error: syncConfigurationErrors.TARGET_FOLDER_NOT_DEFINED
    }
  }

  // Ensure the source folder is not the same as the target folder
  if (config.sourceFolder === config.targetFolder) {
    return {
      valid: false,
      error: syncConfigurationErrors.SOURCE_AND_TARGET_ARE_SAME
    }
  }

  // Ensure the source folder does not contain the target folder
  if (config.targetFolder.indexOf(config.sourceFolder) === 0) {
    return {
      valid: false,
      error: syncConfigurationErrors.SOURCE_FOLDER_CONTAINS_TARGET_FOLDER
    }
  }

  // Ensure there does not exist a folder or file inside the target folder with the same name as the source folder
  const contentsOfTargetFolder = fs.readdirSync(config.targetFolder)
  const sourceFolderBasename = basename(config.sourceFolder)
  if (contentsOfTargetFolder.includes(sourceFolderBasename)) {
    return {
      valid: false,
      error: syncConfigurationErrors.ITEM_ALREADY_EXISTS_IN_TARGET_WITH_SAME_NAME_AS_SOURCE_FOLDER
    }
  }

  // TODO: Ensure the user has permission to move the source folder

  // Otherwise, return success!
  return { valid: true }
}

module.exports = {
  validateSyncConfiguration,
  syncConfigurationErrors,
  errors: syncConfigurationErrors
}
