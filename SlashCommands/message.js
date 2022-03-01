// eslint-disable-next-line no-unused-vars
const { CacheType, Client, CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { serverIp, serverPort } = require('../config.json');
const config_cmd = require('../config-commands.json');
const config = require('../config.json');

const slashCommand = new SlashCommandBuilder()
	.setName('message')
	.setDescription('Envia uma mensagem formatada para o canal onde o comando é executado.')
	.addStringOption(option =>
		option.setName('tipo')
			.setDescription('Tipo de mensagem a ser enviada neste canal.')
			.addChoice('CONEXAO', 'conexao')
			.addChoice('WHITLIST', 'whitlist')
			.setRequired(true));

module.exports = {
	name: slashCommand.name,
	description: slashCommand.description,
	options: slashCommand.options,
    userPermissions: [config.roleIdAdministrador],
	
	/**
	 * 
	 * @param {Client} client 
	 * @param {CommandInteraction<CacheType>} interaction 
	 * @param {String[]} args 
	 * @returns 
	 */
	run: async (client, interaction, args) => {
		
		const optionTipo = interaction.options.getString('tipo');

		if (optionTipo.includes("conexao")) {
			const cmdConexao = config_cmd.conexao;
			const embed = new MessageEmbed()
				.setColor(cmdConexao.corMensagem)
				.setTitle(cmdConexao.titulo)
				.setDescription(`${cmdConexao.descricao}\n${ cmdConexao.mostrarConnect ? `\n\`connect ${serverIp}:${serverPort}\`\n` : ""}`)
				.setImage(`${cmdConexao.urlImageGif}`);
	
			const row = new MessageActionRow()
				.addComponents(
					new MessageButton()
						// .setURL(`fivem://connect/${serverIp}:${serverPort}`)
						.setURL(`${cmdConexao.urlBotaoJogar}`)
						.setLabel('JOGAR!')
						.setStyle('LINK')
						.setEmoji('🎮'));
	
			// await interaction.deferReply();
			await interaction.channel.send({ ephemeral: true, embeds: [embed], components: [row] });
			// await interaction.deleteReply();
		} else if (optionTipo.includes("whitlist")) {
			const cmdWhitlist = config_cmd.whitelist;
			const embed = new MessageEmbed()
				.setColor(cmdWhitlist.corMensagem)
				.setTitle(cmdWhitlist.titulo)
				.setDescription(cmdWhitlist.descricao);

			const row = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('init-wl')
						.setLabel(cmdWhitlist.labelBotaoWL)
						.setStyle('SUCCESS')
						.setEmoji('📑'));

			// await interaction.deferReply();
			await interaction.channel.send({ ephemeral: true, embeds: [embed], components: [row] });
			// await interaction.deleteReply();
		}
	},
};