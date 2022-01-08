const fs = require('fs');
const { Client, Collection, Intents, MessageActionRow, MessageButton, MessageEmbed, Permissions } = require('discord.js');
const { token, channelId } = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

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
                .setStyle('SUCCESS'));

    const channel = client.channels.cache.get(channelId);
    channel.send({ ephemeral: true, embeds: [embed], components: [row] })
});

client.on("guildMemberAdd", member => {
    member.send("Seja bem vindo!");
});

client.on("messageCreate", message => {
    if(!message.author.bot) {
        if(message.content === "oi") {
            message.reply("Olá! Este é meu primeiro bot!");
        }
    }
});

client.on('interactionCreate', interaction => {
	if (!interaction.isButton()) return;

    if(interaction.customId == "init-wl") {
        console.log("if");
        const user = interaction.user;
        const server = interaction.guild;
        // const member = interaction.member;
    
        const nomeCanal = "wl-teste-0001";
    
        server.channels.create(nomeCanal, {
            type: "GUILD_TEXT",
            reason: `Canal WL de ${user.tag}`,
            permissionOverwrites: [
                {
                    type: 'role',
                    id: "929246249679486977",
                    deny: [Permissions.FLAGS.VIEW_CHANNEL]
                },
                {
                    type: 'member',
                    id: user.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                },
                {
                    type: 'role',
                    id: "929249485366911017",
                    allow: [Permissions.FLAGS.VIEW_CHANNEL]
                }
            ]
        })
        .catch(console.error);
    
        interaction.reply(`<@${user.id}> ***Sua whitelist foi iniciada em outro canal.***\n\nEsta mensagem será excluida em poucos segundos!`);
        setTimeout(() => {
            interaction.deleteReply();
        }, 10000)
    }
});

client.login(token);
