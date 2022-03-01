const client = require("../index");
const whitelist = require('../whitelist/wl');
const { exit } = require('process');

client.on("ready", async () => {

    await whitelist.readyInit(client);
    const ret = whitelist.validadeReady();

    if(ret != 0) {
        console.error("ERRO!!!");
        console.error(ret);
        exit(1);
    }

    client.user.setActivity("SAMPA ROLEPLAY", {
        type: "PLAYING"
    });

    console.log(`BOT online: ${client.user.tag}`);
});