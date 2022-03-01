const client = require("../index");
const whitelist = require('../whitelist/wl');
const config = require('../config.json');

client.on("messageCreate", async message => {
    if(!message.author.bot) {
        const channel = message.channel;
        if(channel.name.includes(`${config.prefixChannelNameWL}-`)) {
            whitelist.receiveMessageWL(message);
        }
    }
});