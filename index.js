const fs = require('fs');
const { Client, Collection, Intents, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const config = require('./config.json');
const whitelist = require('./whitelist/wl');

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ] 
});
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

client.commands = new Collection();

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.once("ready", () => {
    console.log(`BOT online: ${client.user.tag}`);

    const embed = new MessageEmbed()
        .setColor('#f73305')
        .setTitle('Sistema de whitelist!')
        .setDescription(`Para fazer sua whitelist pressione o botão abaixo\n\n**ATENÇÃO:** Será criado um novo canal para iniciar sua WL.`);

    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('init-wl')
                .setLabel('INICIAR WL')
                .setStyle('SUCCESS')
                .setEmoji('📑'));

    const channel = client.channels.cache.get(config.channelIdCanalWL);
    channel.send({ ephemeral: true, embeds: [embed], components: [row] });
});

client.on("messageCreate", message => {
    if(!message.author.bot) {
        const channel = message.channel;
        if(channel.name.includes(`${config.prefixChannelNameWL}-`)) {
            // message.guild.members.get(message.author.id).setNickname("TESTE 123");
            whitelist.receiveMessageWL(message);
        }
    }
});

client.on('interactionCreate', async interaction => {
	if (interaction.isButton()) {
        if(interaction.customId == "init-wl") {
            whitelist.createChannel(interaction);
        }
    } else if (interaction.isSelectMenu()) {
        if(interaction.customId == "select-menu-wl") {
            // console.log(interaction);
            await whitelist.receiveSelectMenuWL(interaction);
            await interaction.deferUpdate();
            // interaction.channel.members.get(interaction.user.id).setNickname("TESTE");
            // interaction.member.setNickname(``, "APROVADO na Whitelist");
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
