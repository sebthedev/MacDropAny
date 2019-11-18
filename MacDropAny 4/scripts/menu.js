const {
  app,
  Menu,
  shell
} = require('electron')
const strings = require('./strings')

console.log(`Attempting to set custom app menu in locale ${app.getLocale()}.`)

const isMac = process.platform === 'darwin'

const menuItems = [
  {
    label: app.name,
    submenu: [
      {
        role: 'about',
        label: strings.get('About MacDropAny')
      },
      { type: 'separator' },
      {
        label: 'Donate to the creator of MacDropAny',
        click: async () => {
          await shell.openExternal('https://www.sebthedev.com/donate')
        }
      },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    role: 'fileMenu'
  },
  {
    role: 'editMenu'
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Visit MacDropAny\'s website',
        click: async () => {
          await shell.openExternal('https://www.sebthedev.com/macdropany')
        }
      }
    ]
  }
]

console.log(`creating menu in locale ${app.getLocale}.`)
const menu = Menu.buildFromTemplate(menuItems)
Menu.setApplicationMenu(menu)
