const fs = require('fs')
const path = require('path')
const electron = require('electron')
const app = electron.app ? electron.app : electron.remote.app

console.log(`Package locale is ${app.getLocale()}. App's ready status is ${app.isReady()}.`)

const loadStrings = function () {
  const localeStringsPath = path.join(__dirname, '../strings/' + app.getLocale() + '.json')
  console.log(localeStringsPath)
  if (fs.existsSync(localeStringsPath)) {
    return JSON.parse(fs.readFileSync(localeStringsPath, 'utf8'))
  } else {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../strings/en.json'), 'utf8'))
  }
}
const strings = loadStrings()

const getString = function (stringName, variables) {
  let stringToReturn = strings[stringName] || stringName
  if (variables) {
    for (const variableIndex in variables) {
      stringToReturn = stringToReturn.replace('$' + variableIndex, variables[variableIndex])
    }
  }
  return stringToReturn
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

const getLocale = function () {
  return app.getLocale()
}

module.exports = {
  displayPageStrings: function () {
    displayPageStrings(strings)
  },
  getString: getString,
  get: getString,
  getLocale: getLocale
}
