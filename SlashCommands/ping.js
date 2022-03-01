// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config.json');

const slashCommand = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Comando para validar status do bot, responde com o tempo que foi entregue a mensagem ao bot.');

module.exports = {
    name: slashCommand.name,
    description: slashCommand.description,
    userPermissions: [config.roleIdAdministrador],
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        interaction.editReply({ content: `${client.ws.ping}ms!` });
    },
};