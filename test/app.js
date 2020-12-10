const glob = require('glob');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const findFiles = promisify(glob);
const { md5 } = require('../utils');

const getHashFiles = async(dir) => {
    const hashes = [];

    const absPath = path.resolve(dir);
    const filePaths = await findFiles(`${absPath}/**/*`);
    
    for(const filePath of filePaths) {
        if(fs.lstatSync(filePath).isDirectory()) {
            continue;
        }

        const hash = await md5.fileSync(filePath);
        const pathFile = filePath.replace(dir + '/', '')
            .split('/');
        
        pathFile.pop();

        hashes.push({
            name: filePath.split('/').pop(),
            path: pathFile.join('/'),
            hash,
        })
    }

    fs.writeFileSync("./files.json", JSON.stringify({ files: hashes }, null, 4));
}

getHashFiles(`C:/xampp/htdocs/gta`);