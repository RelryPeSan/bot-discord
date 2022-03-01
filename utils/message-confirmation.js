// eslint-disable-next-line no-unused-vars
const { CacheType, ButtonInteraction, Interaction, Collection, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const uuid = require('uuid');

const prefixCustonId = 'message-confirmation'
const mc = {};
const listRequests = new Collection();

/**
 * 
 * @param {Interaction<CacheType>} interaction 
 * @param {MessageEmbed} message 
 * @param {Function} cbSim 
 * @param {Function} cbNao 
 */
mc.createConfirmation = function(interaction, message, cbSim, cbNao) {
    const id = uuid.v4();
    const {title, description} = message;

    const embed = new MessageEmbed()
        .setColor('#ECEC00')
        .setTitle(title)
        .setDescription(description);

    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(`${prefixCustonId}/sim/${id}`)
                .setLabel('SIM')
                .setStyle('SECONDARY')
                .setEmoji('⚠️'))
        .addComponents(new MessageButton()
                .setCustomId(`${prefixCustonId}/nao/${id}`)
                .setLabel('NÃO')
                .setStyle('PRIMARY')
                .setEmoji('❌'));

    interaction.editReply({ ephemeral: true, embeds: [embed], components: [row] });

    listRequests.set(id, {cbSim: cbSim, cbNao: cbNao})

}

/**
 * 
 * @param {ButtonInteraction<CacheType>} interaction 
 */
mc.responseMessage = function(interaction) {
    var array = interaction.customId.split('/');
    // var array = "".split('/');
    if(array.length == 3) {
        var req = listRequests.get(array[2]);
        if(array[1] == "sim" && typeof(req.cbSim) == 'function') req.cbSim(interaction);
        else if(array[1] == "nao" && typeof(req.cbNao) == 'function') req.cbNao(interaction);
        listRequests.delete(array[2]);
    }
}

module.exports = mc;
