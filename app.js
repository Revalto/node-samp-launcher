const { app, BrowserWindow, ipcMain } = require('electron')
const ClientManager = require('./ClientManager');
const { SampQuery } = require('./utils');

const fs = require('fs');

const { files } = require('./files.json');

class Application {
  constructor() {
    this.mainWindow = null;

    this.url = `http://localhost/gta`;
    this.gamePath = `./gta_sa`;
    this.servers = [
      {
        ip: `78.108.216.35`,
        port: 7777,
      },
      {
        ip: `80.93.220.67`,
        port: 7777,
      },
      {
        ip: `193.70.7.93`,
        port: 7777,
      }
    ];
    this.files = files;

    this.client = null;
    this.SampQuery = new SampQuery();

    this.createWindow = this.createWindow.bind(this);

    this.init();
  }

  init() {
    app.whenReady().then(this.createWindow)

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow()
      }
    })
  }

  async getServersOnline() {
    return await Promise.all(
      this.servers.map(async(res) => {
        const data = await this.SampQuery.getServerInfo(res.ip, res.port);

        return {
          ip: `${res.ip}:${res.port}`,
          ...data
        }
      })
    );
  }

  async createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      show: false,
      resizable: false,
      // transparent: true,
      // frame: false,
      webPreferences: {
        nodeIntegration: true
      }
    })

    const answer = await this.getServersOnline();
    await Promise.all([
      this.mainWindow.loadFile('./app/index.html'),
      this.mainWindow.webContents.openDevTools(),
    ])

    this.mainWindow.once('ready-to-show', () => {
      this.client = new ClientManager(this);

      this.mainWindow.webContents.send(`Online:Init`, answer);
      this.mainWindow.show();

      ipcMain.on('Press:Play', this.client.onPressPlay);
      ipcMain.on('Online:Check', async(event) => {
        const answer = await this.getServersOnline();

        event.reply('Online:Answer', answer);
      });
    })
  }
}

const thisApplication = new Application();