const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Comando para validar status do bot, responde com Pong!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};