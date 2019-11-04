const validateSyncConfiguration = function (config) {
  if (!config.sourceFolder || !config.targetFolder) {
    return false
  }

  // TODO: Better sync validity checking

  return true
}

module.exports = {
  validateSyncConfiguration
}
