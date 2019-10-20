const fs = require('fs')
const path = require('path')
const electron = require('electron')
const app = electron.app ? electron.app : electron.remote.app

const loadStrings = function () {
  const localeStringsPath = path.join(__dirname, '../strings/' + app.getLocale() + '.json')
  if (fs.existsSync(localeStringsPath)) {
    return JSON.parse(fs.readFileSync(localeStringsPath, 'utf8'))
  } else {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../strings/en.json'), 'utf8'))
  }
}
const strings = loadStrings()

const getString = function (stringName) {
  if (strings[stringName]) {
    return strings[stringName]
  } else {
    return 'No String Exists'
  }
}

const displayPageStrings = function (strings) {
  // Find the page elements that need strings
  const elementsNeedingStrings = window.$('[data-string]')

  // Insert the string into each element
  elementsNeedingStrings.each(function (i, element) {
    const stringName = window.$(element).data('string')
    const string = getString(stringName)
    window.$(element).text(string)
  })
}

module.exports = {
  displayPageStrings: function () {
    displayPageStrings(strings)
  },
  getString: getString
}
