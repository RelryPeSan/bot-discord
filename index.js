const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const config = require('./config.json');
const whitelist = require('./whitelist/wl');

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ] 
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.once("ready", () => {
    console.log(`BOT online: ${client.user.tag}`);
});

client.on("guildMemberAdd", member => {
    console.log("teste")
    console.log("!member.user.bot: " + toString(!member.user.bot))
    if(!member.user.bot) {
        console.log("teste no if")
        whitelist.newerMember(member);
    }
});

client.on("messageCreate", async message => {
    if(!message.author.bot) {
        const channel = message.channel;
        if(channel.name.includes(`${config.prefixChannelNameWL}-`)) {
            whitelist.receiveMessageWL(message);
        }
    }
});

client.on('interactionCreate', async interaction => {
	if (interaction.isButton()) {
        switch(interaction.customId) {
            case "init-wl":
                await whitelist.createChannel(interaction);
                break;

            case "finished-wl":
                await whitelist.confirmButtonWL(interaction);
                break;
        }
    } else if (interaction.isSelectMenu()) {
        if(interaction.customId.includes("select-menu-wl-")) {
            await whitelist.receiveSelectMenuWL(interaction);
            await interaction.deferUpdate();
        }
    } else if (interaction.isCommand()) {
        const { commandName } = interaction;
        const command = client.commands.get(commandName);
        if(command !== undefined) {
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true });
            }
        }
    }
});

var ret = whitelist.validadeConfig();

if(ret == 0) {
    client.login(config.token);
} else {
    console.error("ERRO!!!");
    console.error(ret);
    return 1;
}
