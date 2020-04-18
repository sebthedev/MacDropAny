const assert = require('assert')

describe('SyncConfiguration', function () {
  const syncer = require('../scripts/syncer.js')
  describe('#validateSyncConfiguration()', function () {
    it('should return SOURCE_FOLDER_NOT_DEFINED or TARGET_FOLDER_NOT_DEFINED when the configuration is empty', function () {
      const result = syncer.validateSyncConfiguration({})
      assert.equal(result.valid, false)
      const validErrors = [syncer.syncConfigurationErrors.SOURCE_FOLDER_NOT_DEFINED, syncer.syncConfigurationErrors.TARGET_FOLDER_NOT_DEFINED]
      assert.equal(validErrors.includes(result.error), true)
    })
    it('should return TARGET_FOLDER_NOT_DEFINED when the target folder is not defined', function () {
      const result = syncer.validateSyncConfiguration({ sourceFolder: '/Source/Folder'})
      assert.equal(result.valid, false)
      assert.equal(result.error, syncer.syncConfigurationErrors.TARGET_FOLDER_NOT_DEFINED)
    })
    it('should return SOURCE_FOLDER_NOT_DEFINED when the source folder is not defined', function () {
      const result = syncer.validateSyncConfiguration({ targetFolder: '/Target/Folder'})
      assert.equal(result.valid, false)
      assert.equal(result.error, syncer.syncConfigurationErrors.SOURCE_FOLDER_NOT_DEFINED)
    })
    it('should return SOURCE_AND_TARGET_ARE_SAME when the source and target folders are the same is empty', function () {
      const result = syncer.validateSyncConfiguration({ sourceFolder: '/A/Folder', targetFolder: '/A/Folder' })
      assert.equal(result.valid, false)
      assert.equal(result.error, syncer.syncConfigurationErrors.SOURCE_AND_TARGET_ARE_SAME)
    })
    it('should return SOURCE_FOLDER_CONTAINS_TARGET_FOLDER when the source folder contains the target folder', function () {
      const result = syncer.validateSyncConfiguration({ sourceFolder: '/A/Folder', targetFolder: '/A/Folder/Dropbox' })
      assert.equal(result.valid, false)
      assert.equal(result.error, syncer.syncConfigurationErrors.SOURCE_FOLDER_CONTAINS_TARGET_FOLDER)
    })
    it('should return ITEM_ALREADY_EXISTS_IN_TARGET_WITH_SAME_NAME_AS_SOURCE_FOLDER when a file or folder already exists inside the target folder with the same name as the source folder', function () {
      const fs = require('fs')

      // Use a pre-existing folder at the root of the system
      const rootFolders = fs.readdirSync('/')
      // Bail out of this test if we can't find a folder to use
      if (rootFolders.length < 1) {
        return
      }
      const result = syncer.validateSyncConfiguration({ sourceFolder: `/Nested/Inside/${rootFolders[0]}`, targetFolder: '/' })
      assert.equal(result.valid, false)
      assert.equal(result.error, syncer.syncConfigurationErrors.ITEM_ALREADY_EXISTS_IN_TARGET_WITH_SAME_NAME_AS_SOURCE_FOLDER)
    })
  })
})
