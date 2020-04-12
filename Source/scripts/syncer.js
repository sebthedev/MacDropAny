const validateSyncConfiguration = function (config) {
  console.log('Validating the sync configuration:')
  console.log(config)

  if (!config.sourceFolder || !config.targetFolder) {
    return false
  }

  // TODO: Better sync validity checking

  return true
}

module.exports = {
  validateSyncConfiguration
}
