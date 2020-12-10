const { ipcRenderer } = require('electron')

$(document).ready(() => {

    ipcRenderer.on('Online:Init', (event, res) => {
        res.forEach((server, i) => {
            $('div.servers').append(`
                <div class="servers__item" id="servers__item__${i}">
                    <h1>${server[0].serverName}</h1>
                    <p>${server[0].players} / ${server[0].maxPlayers}</p>
                    <input type="button" id="play" value="Играть" data-ip="${server.ip}">
                </div>
            `)
        })
    })

    ipcRenderer.on('Online:Answer', (event, res) => {
        res.forEach((server, i) => {
            const data = $(`div.servers`).find(`div#servers__item__${i}`);
            
            data.find('h1').text(server[0].serverName);
            data.find('p').text(`${server[0].players} / ${server[0].maxPlayers}`);
        })
    })

    ipcRenderer.on('checkFiles', (event, res) => {
        $('input#play').val('Загрузить');
    })

    ipcRenderer.on('updateProgress', (event, res) => {
        if(res && res.end) {
            $('div.info-block').text(`Загрузка завершена, приятной игры :)`);
            $('input#play').val('Играть');

            return;
        }

        const { fileName, percent, downloaded, size } = res;

        $('div.info-block').text(`Скачивается: ${fileName} (${downloaded} mb. / ${size}) mb.`);
        $('progress#downloaded').val(parseInt(percent));
    });

    $('div.servers').on('click', 'input#play', (e) => {
        const address = $(e.currentTarget).attr('data-ip');
        const [ IP, PORT ] = address.split(':');
        const nick = $('input#name').val();

        if(nick.length < 3 || nick.length > 24) {
            console.log(`Nick error!`);

            return;
        }

        ipcRenderer.send('Press:Play', { ip: IP, port: PORT, nick });
    });

    setInterval(() => {
        ipcRenderer.send('Online:Check', []);
    }, 300000);

});