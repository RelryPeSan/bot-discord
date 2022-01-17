const { Collection, MessageActionRow, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const { roleIdAdministrador, roleIdEveryone, categoryIdCanalWL } = require('../config.json');
const config_wl = require('./config-wl.json');
// const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const wl = {};

var wlNumber = 1;
var dataUsersInWL = new Collection();

wl.validadeConfig = function() {
    if(config_wl.perguntas.length < config_wl.minimoAcertos) {
        return `Quantidade minima de acertos("minimoAcertos") superior a quantidade de "perguntas".`;
    }

    for(var i = 0; i < config_wl.perguntas.length; i++) {
        const p = config_wl.perguntas[i];
        const ret = p.alternativas.filter(p2 => p2.resposta == true);
        if(ret.length == 0) {
            return `A pergunta (index: ${i}) - "${p.pergunta}", não possui nenhuma "resposta: true"`;
        }
    }

    return 0;
}

wl.createChannel = function(interaction) {
    const user = interaction.user;
    const server = interaction.guild;
    const data = {};
    
    if(dataUsersInWL.get(user.id) !== undefined) {
        interaction.reply(`<@${user.id}> ***Você já possui um canal aberto para WL.***\n\nEsta mensagem será excluida em poucos segundos!`);
        setTimeout(() => {
            interaction.deleteReply();
        }, 10000)
        return;
    }

    data.questions = {};
    data.user = user;
    data.wlNumber = wlNumber;

    const nomeCanal = `wl-${`${wlNumber}`.padStart(6, '0')}`;
    wlNumber++;

    server.channels.create(nomeCanal, {
        type: "GUILD_TEXT",
        reason: `Canal WL de ${user.tag}`,
        parent: categoryIdCanalWL,
        permissionOverwrites: [
            {
                type: 'role',
                id: roleIdEveryone,
                deny: [Permissions.FLAGS.VIEW_CHANNEL]
            },
            {
                type: 'role',
                id: roleIdAdministrador,
                allow: [Permissions.FLAGS.VIEW_CHANNEL]
            },
            {
                type: 'member',
                id: user.id,
                allow: [Permissions.FLAGS.VIEW_CHANNEL]
            }
        ]
    })
    .then(storeChannel => {
        data.storeChannel = storeChannel;

        data.perguntas = configPerguntas();
        data.perguntasFixas = configPerguntasFixas();
        data.numPergunta = 0;
        data.numPerguntaFixa = 0;

        dataUsersInWL.set(user.id, data);

        wl.nextFixedAswer(storeChannel, user.id);
    })
    .catch(console.error);

    interaction.reply(`<@${user.id}> ***Sua whitelist foi iniciada no canal: ${nomeCanal}***\n\nEsta mensagem será excluida em poucos segundos!`);
    setTimeout(() => {
        interaction.deleteReply();
    }, 10000);
}

wl.receiveMessageWL = function(message) {
    const channel = message.channel;
    const user = message.author;
    const data = dataUsersInWL.get(user.id);

    if(data !== undefined) {

        data.perguntasFixas[data.numPerguntaFixa].resposta = message;

        data.numPerguntaFixa++;

        wl.nextFixedAswer(channel, user.id);
        console.log(`digitou: ${message}`)
        console.log("usuario em WL sendo removido agora!");
    } else {
        console.log("Este usuario não tem mais WL!");
    }
}

wl.receiveSelectMenuWL = function(interaction) {
    const channel = interaction.channel;
    const user = interaction.user;
    const data = dataUsersInWL.get(user.id);

    if(data !== undefined) {

        data.perguntas[data.numPergunta].resposta = interaction.values[0];

        data.numPergunta++;

        wl.nextAswer(channel, user.id);
        console.log(`selecionou valor: ${interaction.values[0]}`)
    } else {
        console.log("Este usuario não tem mais WL!");
    }
}

wl.nextFixedAswer = function(channel, userId) {
    const data = dataUsersInWL.get(userId);
    if(data !== undefined) {
        if(data.numPerguntaFixa >= data.perguntasFixas.length) {
            wl.nextAswer(channel, userId);
        } else {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`Informações:`)
                .setDescription(`${data.perguntasFixas[data.numPerguntaFixa].pergunta}`);

            channel.send({ ephemeral: true, embeds: [embed] });
        }
    }
}

wl.nextAswer = function(channel, userId) {
    const data = dataUsersInWL.get(userId);
    if(data !== undefined) {
        if(data.numPergunta >= data.perguntas.length) {
            const vr = validaRespostas(userId);
            var respostaWL;
            var colorTag;
            if(vr) {
                colorTag = '#00f99a';
                respostaWL = `Whitelist finalizada! Você foi aprovado! :D`;
            } else {
                colorTag = '#aa0000';
                respostaWL = `Whitelist finalizada! Você foi reprovado! :( Tente novamente.`;
            }
            const embed = new MessageEmbed()
                .setColor(colorTag)
                .setTitle(`Whitelist finalizada!`)
                .setDescription(respostaWL);

            channel.send({ ephemeral: true, embeds: [embed]});
            dataUsersInWL.delete(userId);
            setTimeout(() => channel.delete("Whitelist finalizada!"), 8000);
        } else {
            const alternativas = [];
            for(var i = 0; i < data.perguntas[data.numPergunta].alternativas.length; i++) {
                alternativas.push({
                    label: `${(i+1) + " - " + data.perguntas[data.numPergunta].alternativas[i].descricao}`,
                    value: `${i}`
                });
            }

            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
					.setCustomId('select-menu-wl')
					.setPlaceholder('Nenhuma resposta selecionada.')
					.addOptions(alternativas),
                );

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`Pergunta: ${data.numPergunta + 1} de ${data.perguntas.length}`)
                .setDescription(`${data.perguntas[data.numPergunta].pergunta}`);

            channel.send({ content: `=============== BOT WHITELIST ===============`, ephemeral: true, embeds: [embed], components: [row] });
        }
    }
}

function configPerguntas() {
    return config_wl.perguntas;
}

function configPerguntasFixas() {
    return config_wl.perguntasFixas;
}

function validaRespostas(userId) {
    const data = dataUsersInWL.get(userId);
    const respondidasCorretamente = data.perguntas.filter((v) => {
        const numResp = parseInt(v.resposta);
        return (v.alternativas[numResp] !== undefined && v.alternativas[numResp].resposta == true);
    });
    return respondidasCorretamente.length >= config_wl.minimoAcertos;
}

module.exports = wl;
