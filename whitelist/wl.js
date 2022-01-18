const { Collection, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const config = require('../config.json');
const config_wl = require('./config-wl.json');
// const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const wl = {};
const prefixSelecMenu = "select-menu-wl-";

var roleComWL;
var roleSemWL;
var owner;

var wlNumber = 1;
var dataUsersInWL = new Collection();

wl.validadeConfig = function() {

    if(config_wl.perguntasFixas.length != 2) {
        return `Pergunstas fixas devem ter o tamanho de 2 ("perguntasFixas") para informar o nome e ID do jogo.`;
    }

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

wl.readyInit = async function(client) {
    const guild = client.guilds.cache.get(config.guildId);
    owner = await guild.fetchOwner();
                
    roleComWL = guild.roles.cache.find(r => r.id == config.roleIdComWL);
    roleSemWL = guild.roles.cache.find(r => r.id == config.roleIdSemWL);
}

wl.newerMember = function(member) {
    member.roles.add(roleSemWL);
}

wl.createChannel = async function(interaction) {
    const user = interaction.user;
    const server = interaction.guild;
    const data = {};
    
    if(dataUsersInWL.get(user.id) !== undefined) {
        await interaction.reply(`<@${user.id}> ***Você já possui um canal aberto para WL.***\n\nEsta mensagem será excluida em poucos segundos!`);
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
        parent: config.categoryIdCanalWL,
        permissionOverwrites: [
            {
                type: 'role',
                id: config.roleIdEveryone,
                deny: [Permissions.FLAGS.VIEW_CHANNEL]
            },
            {
                type: 'role',
                id: config.roleIdAdministrador,
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
        const channel = server.channels.cache.get(storeChannel.id);
        const embed = new MessageEmbed()
            .setColor('#fafa0a')
            .setTitle(`ATENÇÃO AO TEMPO!`)
            .setDescription(`Você deve responder o questionario em até ${config_wl.tempoQuestionarioMin} minutos, caso contrario o canal de WL será excluido e será preciso iniciar a whitelist novamente.`);

        channel.send({ ephemeral: true, embeds: [embed]});

        data.storeChannel = storeChannel;

        data.perguntas = configPerguntas();
        data.perguntasFixas = configPerguntasFixas();
        data.numPergunta = 0;
        data.numPerguntaFixa = 0;

        dataUsersInWL.set(user.id, data);

        wl.nextFixedAswer(storeChannel, user.id);
    })
    .catch(console.error);

    await interaction.reply(`<@${user.id}> ***Sua whitelist foi iniciada no canal: ${nomeCanal}***\n\nEsta mensagem será excluida em poucos segundos!`);
    setTimeout(() => {
        interaction.deleteReply();
    }, 10000);

    setTimeout(() => {
        const data2 = dataUsersInWL.get(user.id);
        if(data !== undefined && data2 !== undefined) {
            if(data.storeChannel.id === data2.storeChannel.id) {
                dataUsersInWL.delete(user.id);
                const channel = server.channels.cache.get(data.storeChannel.id);
                if(channel !== undefined) {
                    const embed = new MessageEmbed()
                        .setColor('#f73305')
                        .setTitle(`TEMPO EXPIRADO!`)
                        .setDescription(`Você não respondeu as pergunstas no tempo previsto, este canal será deletado em breve, tente fazer WL novamente.`);

                    channel.send({ ephemeral: true, embeds: [embed]});
                    setTimeout(() => {
                        channel.delete("Tempo de WL expirado!");
                    }, 10000);
                }
            }
        }
    }, config_wl.tempoQuestionarioMin * 60000);
}

wl.receiveMessageWL = function(message) {
    const channel = message.channel;
    const user = message.author;
    const data = dataUsersInWL.get(user.id);

    if(data !== undefined) {

        if(data.numPerguntaFixa < data.perguntasFixas.length) {
            data.perguntasFixas[data.numPerguntaFixa].resposta = message;
            data.numPerguntaFixa++;
    
            wl.nextFixedAswer(channel, user.id);
        } else {
            message.delete();
        }
    } else {
        console.log("Este usuario não tem mais um canal de WL!");
    }
}

wl.receiveSelectMenuWL = function(interaction) {
    const channel = interaction.channel;
    const user = interaction.user;
    const data = dataUsersInWL.get(user.id);

    if(data !== undefined) {
        const valor = parseInt(interaction.customId.substring(prefixSelecMenu.length));

        data.perguntas[valor].resposta = interaction.values[0];
        if(valor == data.numPergunta) {
            data.numPergunta++;
    
            wl.nextAswer(channel, user.id);
        }
    } else {
        console.log("Este usuario não tem mais um canal de WL!");
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
        if(data.numPergunta >= data.perguntas.length && data.buttonConfirm != true) {
            data.buttonConfirm = true;
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('FIM DO QUESTIONÁRIO!')
                .setDescription(`Revise suas respostas!\nPressione o botão abaixo para encerrar o questionário.`);

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('finished-wl')
                        .setLabel('Finalizar questionário')
                        .setStyle('PRIMARY')
                        .setEmoji('✔️'));

            channel.send({ ephemeral: true, embeds: [embed], components: [row] });
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
					.setCustomId(`${prefixSelecMenu}${data.numPergunta}`)
					.setPlaceholder('Nenhuma resposta selecionada.')
					.addOptions(alternativas),
                );

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`Pergunta: ${data.numPergunta + 1} de ${data.perguntas.length}`)
                .setDescription(`${data.perguntas[data.numPergunta].pergunta}`);

            channel.send({ content: `\n──────────── BOT WHITELIST ────────────`, ephemeral: true, embeds: [embed], components: [row] });
        }
    }
}

wl.confirmButtonWL = async function(interaction) {
    const channel = interaction.channel;
    const userId = interaction.user.id;
    const data = dataUsersInWL.get(userId);
    if(data !== undefined) {
        const vr = validaRespostas(userId);
        var respostaWL;
        var colorTag;
        if(vr) {
            colorTag = '#00f933';
            respostaWL = `Whitelist finalizada! Você foi aprovado! :D`;
            if(userId !== owner.id) {
                interaction.member.setNickname(`${data.perguntasFixas[0].resposta} | ${data.perguntasFixas[1].resposta}`, "APROVADO na Whitelist");
                interaction.member.roles.remove(roleSemWL);
                interaction.member.roles.add(roleComWL);
            } else {
                channel.send("ATENÇÃO!!! O bot não tem permissão para alterar nick e cargo do dono do servidor!");
            }
        } else {
            colorTag = '#f73305';
            respostaWL = `Whitelist finalizada! Você foi reprovado! :( Tente novamente.`;
        }
        const embed = new MessageEmbed()
            .setColor(colorTag)
            .setTitle(`Whitelist finalizada!`)
            .setDescription(respostaWL);
    
        channel.send({ ephemeral: true, embeds: [embed]});
        dataUsersInWL.delete(userId);
        setTimeout(() => channel.delete("Whitelist finalizada!"), 10000);
    }
    await interaction.deferUpdate();
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
