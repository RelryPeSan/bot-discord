const { Client, Collection, Intents } = require('discord.js');
const config = require('./config.json');
const whitelist = require('./whitelist/wl');

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS
    ] 
});
module.exports = client;

client.config = config;
client.mc = require('./utils/message-confirmation');
client.commands = new Collection();
client.slashCommands = new Collection();

var ret = whitelist.validadeConfig();

if(ret == 0) {
    // Initializing the project
    require("./handler")(client);

    client.login(config.token);
} else {
    console.error("ERRO!!!");
    console.error(ret);
    return 1;
}
