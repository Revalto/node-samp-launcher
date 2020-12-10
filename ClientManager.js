const request = require('request');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const md5 = require('./utils/md5');

module.exports = class ClientManager {
    constructor(data) {
        Object.entries(data).forEach(([key, value]) => this[key] = value);

        this.checkFiles = this.checkFiles.bind(this);
        this.onPressPlay = this.onPressPlay.bind(this);
    }

    async download(url, dest) {
        const file = fs.createWriteStream(dest);
        const sendReq = request.get(url);

        let thisState = {
            len: 0,
            total: 0,
            cur: 0
        };

        const onError = (err) => {
            fs.unlink(dest);
            return err.message;
        }

        sendReq.on('response', (response) => {
            if (response.statusCode !== 200) {
                return response.statusCode;
            }

            thisState["len"] = Math.floor(response.headers['content-length'], 10)
            thisState["total"] = thisState["len"] / 1048576;
    
            sendReq.pipe(file);
        });

        sendReq.on('data', (chunk) => {
            thisState["cur"] += chunk.length;

            this.mainWindow.webContents.send(`updateProgress`, {
                fileName: dest.split('/').pop(),
                percent: (100 * thisState["cur"] / thisState["len"]).toFixed(2),
                downloaded: (thisState["cur"] / 1048576).toFixed(2),
                size: thisState["total"].toFixed(2)
            });
        })

        file.on('finish', () => file.close());

        sendReq.on('error', onError);
        file.on('error', onError);
    };

    async checkFiles() {
        await Promise.all([
            this.files.map(async(res) => {
                const dirPath = path.join(__dirname, this.gamePath, res.path);
                const filePath = path.join(__dirname, this.gamePath, res.path, res.name);

                // Проверка на папку
                if (!fs.existsSync(dirPath)) {
                    await fs.mkdirSync(dirPath, { recursive: true });
                }

                // Проверка на путь к файлу + проверка на хеш, если файл существует
                const isFounded = fs.existsSync(filePath);
                const hash = isFounded
                    ? await md5.fileSync(filePath)
                    : null;

                // Скачиваем если не проходит
                if(!isFounded || res.hash != hash) {
                    this.mainWindow.webContents.send(`checkFiles`, { fileName: res.name });
                    await this.download(`${this.url}/${res.path}/${res.name}`, filePath);
                }
            })
        ]);

        this.mainWindow.webContents.send(`updateProgress`, {
            end: true
        });
    }

    async onPressPlay(event, res) {
        const isDownloaded = await this.checkFiles();
        const gamePath = path.join(__dirname, this.gamePath, 'samp.exe');

        execFile(gamePath, [`-n ${res.nick}`, `-h ${res.ip}`, `-p ${res.port}`], (err, data) => {
            if(err) {
                console.log(`Err`, err);
            }

            console.log(data);
        });
    }
}