const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('messagewhitelist')
		.setDescription('Envia a mensagem com o botão de criar WL no canal utilizado.'),
	async execute(interaction) {
		
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

		await interaction.deferReply();
		await interaction.channel.send({ ephemeral: true, embeds: [embed], components: [row] });
		await interaction.deleteReply();
	},
};