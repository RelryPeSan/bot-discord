// eslint-disable-next-line no-unused-vars
const { CacheType, Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config.json');

const slashCommand = new SlashCommandBuilder()
	.setName('gerenciacargo')
	.setDescription('Gerencia (Remove/Adiciona) os cargos de todos os membros informando o do cargo.')
	.addStringOption(option =>
		option.setName('tipo')
			.setDescription('Tipo do gerenciamento de cargo (ADICIONAR/REMOVER)')
			.addChoice('ADICIONAR', 'adicionar')
			.addChoice('REMOVER', 'remover')
			.setRequired(true))
	.addRoleOption(option =>
		option.setName('cargo')
			.setDescription('Informe o cargo a ser manipulado.')
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
		const guild = interaction.guild;
		const optionCargo = interaction.options.getRole('cargo');
		const optionTipo = interaction.options.getString('tipo');
		var corMensagem;
		var titulo;
		var descricao;

		if(optionCargo === undefined) {
			corMensagem = '#f73305';
			titulo = "ERRO!";
			descricao = 'Argumento obrigatório. cargo'
		} else {
			// const roleSearch = guild.roles.cache.get(optionCargo);
			if(optionCargo !== undefined) {
				client.mc.createConfirmation(interaction, {title: 'CONFIRMAÇÃO', description: `Tem certeza que deseja '${optionTipo}' de TODOS os membros do SERVIDOR o cargo "${optionCargo.name}"?`}, 
					async function() {
						if (optionTipo.includes("adicionar")) {
							const membersWithRole = (await guild.members.list({cache:false,limit:1000}))
								.filter(gm => gm.roles.cache.get(optionCargo.id) === undefined && !gm.user.bot);
							membersWithRole.forEach((gm) => {
								gm.roles.add(optionCargo);
							})
							corMensagem = '#00f933';
							titulo = "Comando executado!";
							descricao = `Foram adicionados ${membersWithRole.size} membros com o cargo "${optionCargo.name}"`;
						} else if (optionTipo.includes("remover")) {
							const membersWithRole = (await guild.members.list({cache:false,limit:1000}))
								.filter(gm => gm.roles.cache.get(optionCargo.id) !== undefined && !gm.user.bot);
							membersWithRole.forEach((gm) => {
								gm.roles.remove(optionCargo);
							})
							corMensagem = '#00f933';
							titulo = "Comando executado!";
							descricao = `Foram removidos ${membersWithRole.size} membros com o cargo "${optionCargo.name}"`;
						}

						const embed = new MessageEmbed()
							.setColor(corMensagem)
							.setTitle(titulo)
							.setDescription(descricao);

						interaction.editReply({ ephemeral: true, embeds: [embed], components: [] });
					}, 
					function() {
						const embed = new MessageEmbed()
							.setColor('#f73305')
							.setTitle('CANCELADO')
							.setDescription('Nenhum cargo foi alterado.');

						interaction.editReply({ ephemeral: true, embeds: [embed], components: [] });
					}
				);
			} else {
				corMensagem = '#f73305';
				titulo = "Comando NÃO executado!";
				descricao = `O id do cargo informado não existe."`;
			}
		}
		
		if(titulo !== undefined && descricao !== undefined) {
			const embed = new MessageEmbed()
				.setColor(corMensagem)
				.setTitle(titulo)
				.setDescription(descricao);
	
			interaction.editReply({ ephemeral: true, embeds: [embed] });
		}
	},
};
