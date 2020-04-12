const {
  app,
  Menu,
  shell
} = require('electron')
const strings = require('./strings')

console.log(`Attempting to set custom app menu in locale ${strings.getLocale()}.`)

const menuItems = [
  {
    label: app.name,
    submenu: [
      {
        role: 'about',
        label: strings.get('about-macdropany')
      },
      { type: 'separator' },
      {
        label: strings.get('donate-menu-item'),
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
        label: strings.get('visit-macdropany-website'),
        click: async () => {
          await shell.openExternal('https://www.sebthedev.com/macdropany')
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(menuItems)
Menu.setApplicationMenu(menu)
