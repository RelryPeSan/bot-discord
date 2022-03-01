// eslint-disable-next-line no-unused-vars
const { Client, ButtonInteraction, SelectMenuInteraction, TextChannel, CacheType, Collection, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions, GuildMember, Message } = require('discord.js');
const config = require('../config.json');
const config_wl = require('./config-wl.json');
const database = require('./database');

const wl = {};
const prefixSelecMenu = "select-menu-wl-";

var roleComWL;
var roleSemWL;
var owner;
var channelAprovados;
var channelReprovados;

var wlNumber = 1;
var dataUsersInWL = new Collection();

wl.validadeConfig = function() {

    if(config_wl.alternativaNoMenuSelecao === undefined) {
        return "config_wl.alternativaNoMenuSelecao > deve ser definido.";
    } else if(typeof(config_wl.alternativaNoMenuSelecao) !== "boolean") {
        return "config_wl.alternativaNoMenuSelecao > deve ser booleano ( true | false ).";
    }

    if(config_wl.tempoQuestionarioMin === undefined) {
        return "config_wl.tempoQuestionarioMin > deve ser definido.";
    } else if(typeof(config_wl.tempoQuestionarioMin) !== "number") {
        return "config_wl.tempoQuestionarioMin > deve ser numerico.";
    }

    if(config_wl.perguntasAleatorias === undefined) {
        return "config_wl.perguntasAleatorias > deve ser definido.";
    } else if(typeof(config_wl.perguntasAleatorias) !== "boolean") {
        return "config_wl.perguntasAleatorias > deve ser booleano ( true | false ).";
    }

    if(config_wl.respostasAleatorias === undefined) {
        return "config_wl.respostasAleatorias > deve ser definido.";
    } else if(typeof(config_wl.respostasAleatorias) !== "boolean") {
        return "config_wl.respostasAleatorias > deve ser booleano ( true | false ).";
    }

    if(config_wl.minimoAcertos === undefined) {
        return "config_wl.minimoAcertos > deve ser definido.";
    } else if(typeof(config_wl.minimoAcertos) !== "number") {
        return "config_wl.minimoAcertos > deve ser numerico.";
    } else if(config_wl.minimoAcertos < 0) {
        return "config_wl.minimoAcertos > deve ser um numero inteiro positivo.";
    }

    if(config_wl.perguntasFixas === undefined) {
        return "config_wl.perguntasFixas > deve ser definido.";
    } else if(config_wl.perguntasFixas.length != 1) {
        return `Pergunstas fixas deve ter o tamanho de 1 ("perguntasFixas") para informar o nome do personagem do jogo.`;
    }

    if(config_wl.perguntas === undefined) {
        return "config_wl.perguntas > deve ser definido.";
    } else if(config_wl.perguntas.length < config_wl.minimoAcertos) {
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

/**
 * 
 * @param {Client<boolean>} client 
 */
wl.readyInit = async function(client) {
    const guild = client.guilds.cache.get(config.guildId);
    owner = await guild.fetchOwner();
                
    roleSemWL = await guild.roles.cache.find(r => r.id == config.roleIdSemWL);
    roleComWL = await guild.roles.cache.find(r => r.id == config.roleIdComWL);
    
    channelAprovados = await guild.channels.cache.get(config.channelIdAprovados);
    channelReprovados = await guild.channels.cache.get(config.channelIdReprovados);
}

wl.validadeReady = function() {
    if(roleSemWL === undefined) {
        return `A variavel "roleSemWL" não foi encontrada, verifique o id informado em config.js > "roleIdSemWL"`;
    }

    if(roleComWL === undefined) {
        return `A variavel "roleComWL" não foi encontrada, verifique o id informado em config.js > "roleIdComWL"`;
    }

    if(owner === undefined) {
        return `A variavel "owner" não foi encontrada, verifique se o bot possui as permissões necesserias dentro do servidor.`;
    }

    if(channelAprovados === undefined) {
        return `A variavel "channelAprovados" não foi encontrada, verifique o id informado em config.js > "channelIdAprovados".`;
    }

    if(channelReprovados === undefined) {
        return `A variavel "channelReprovados" não foi encontrada, verifique o id informado em config.js > "channelIdReprovados".`;
    }

    if(config.useDatabase) {
        database.connect();
    }

    return 0;
}

/**
 * 
 * @param {GuildMember} member 
 */
wl.newerMember = function(member) {
    member.roles.add(roleSemWL);
}

/**
 * 
 * @param {ButtonInteraction<CacheType>} interaction 
 * @returns 
 */
wl.createChannel = async function(interaction) {
    const user = interaction.user;
    const server = interaction.guild;
    const data = {};
    
    if(dataUsersInWL.get(user.id) !== undefined) {
        await interaction.reply({ content: `<@${user.id}> ***Você já possui um canal aberto para WL.***\n\nEsta mensagem será excluida em poucos segundos!`, ephemeral: true });
        // setTimeout(() => { // comentado porque não é possivel deletar um reply do tipo Ephemeral
        //     interaction.deleteReply();
        // }, 10000)
        return;
    }

    data.user = user;
    data.wlNumber = wlNumber;

    const tag = user.tag.replaceAll("#", "");

    const nomeCanal = `wl-${tag}-${`${wlNumber}`.padStart(4, '0')}`.toLowerCase();
    wlNumber++;

    if(config.useDatabase) {
        const result = await database.searchIdFivemByIdDiscord(user.id);

        if(result === undefined) {
            await interaction.reply({ content: `<@${user.id}> **Tente conectar na cidade primeiro para gerar seu ID**\n\n**IMPORTANTE:** Seu fivem precisa ter o discord vinculado.`, ephemeral: true });
            // setTimeout(() => { // comentado porque não é possivel deletar um reply do tipo Ephemeral
            //     interaction.deleteReply()
            //     .catch((err) => { console.error(`Erro ao deletar interação!\nERRO: ${err}`); });
            // }, 15000);
            return
        }

        data.id_fivem = result.user_id;
    }

    server.channels.create(nomeCanal, {
        type: "GUILD_TEXT",
        reason: `Canal WL de ${user.tag}`,
        parent: config.categoryIdCanalWL,
        permissionOverwrites: [
            {
                type: 'role',
                id: config.guildId,
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

    await interaction.reply({ content: `<@${user.id}> ***Sua whitelist foi iniciada no canal: ${nomeCanal}***`, ephemeral: true });
    // setTimeout(() => { // comentado porque não é possivel deletar um reply do tipo Ephemeral
    //     interaction.deleteReply();
    // }, 10000);

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

/**
 * 
 * @param {Message<boolean>} message 
 */
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

/**
 * 
 * @param {SelectMenuInteraction<CacheType>} interaction 
 */
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

/**
 * 
 * @param {TextChannel} channel 
 * @param {String} userId 
 */
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

/**
 * 
 * @param {TextChannel} channel 
 * @param {String} userId 
 */
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
            var descAlternativas = "";
            for(var i = 0; i < data.perguntas[data.numPergunta].alternativas.length; i++) {
                var alternativa = `${(i+1) + " - " + data.perguntas[data.numPergunta].alternativas[i].descricao}`;
                alternativas.push({
                    label: `${config_wl.alternativaNoMenuSelecao ? alternativa : ""+(i+1)}`,
                    value: `${i}`
                });
                descAlternativas += `\n${alternativa}`;
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
                .setDescription(`${data.perguntas[data.numPergunta].pergunta}${config_wl.alternativaNoMenuSelecao ? "" : "\n"+descAlternativas}`);

            channel.send({ content: `\n──────────── WHITELIST ────────────`, ephemeral: true, embeds: [embed], components: [row] });
        }
    }
}

/**
 * 
 * @param {ButtonInteraction<CacheType>} interaction 
 */
wl.confirmButtonWL = async function(interaction) {
    const channel = interaction.channel;
    const userId = interaction.user.id;
    const data = dataUsersInWL.get(userId);
    if(data !== undefined) {
        data.isAprovado = validaRespostas(userId);
        var respostaWL;
        var colorTag;
        if(data.isAprovado) {
            colorTag = '#00f933';
            respostaWL = `Whitelist finalizada! Você foi aprovado! :D`;
            if(userId !== owner.id) {
                interaction.member.setNickname(`${data.perguntasFixas[0].resposta} | ${data.id_fivem}`, "APROVADO na Whitelist");
            } else {
                channel.send("ATENÇÃO!!! O bot não tem permissão para alterar nick do dono do servidor!");
            }
            interaction.member.roles.remove(roleSemWL);
            interaction.member.roles.add(roleComWL);
            if(config.useDatabase) {
                database.whitelistUSerId(data.id_fivem);
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
        sendLogWhitelistChannel(data);
        dataUsersInWL.delete(userId);
        setTimeout(() => channel.delete("Whitelist finalizada!"), 10000);
    }
    await interaction.deferUpdate();
}

function sendLogWhitelistChannel(data) {
    var tagColor;

    if(data.isAprovado) {
        tagColor = '#00f933';
    } else {
        tagColor = '#f73305';
    }

    const embed = new MessageEmbed()
        .setColor(tagColor)
        .setTitle('Resultado da Whitelist')
        // .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
        // .setDescription('Some description here')
        .setThumbnail(config.thumbnailLogo)
        .addFields(
            { name: 'USUÁRIO', value: `<@${data.user.id}>` },
            { name: 'NOME DO PERSONAGEM', value: `${data.perguntasFixas[0].resposta}`, inline: true },
            { name: 'ID', value: `${data.id_fivem}`, inline: true },
            // { name: '\u200B', value: '\u200B' },
            { name: 'RESULTADO', value: `${data.isAprovado ? "APROVADO" : "REPROVADO"}` },
            { name: 'PONTUAÇÃO', value: `${data.respondidasCorretamente.length}/${data.perguntas.length}`, inline: true },
            { name: 'MIN.', value: `${config_wl.minimoAcertos}`, inline: true },
        )
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp();

    if(data.isAprovado) {
        channelAprovados.send({ embeds: [embed] });
    } else {
        channelReprovados.send({ embeds: [embed] });
    }
}

function configPerguntas() {
    var perguntas = config_wl.perguntas;

    if(config_wl.perguntasAleatorias) {
        perguntas = shuffle(perguntas);
    }

    if(config_wl.respostasAleatorias) {
        perguntas.forEach(e => {
            e.alternativas = shuffle(e.alternativas);
        });
    }

    return perguntas;
}

function shuffle(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        var randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }

function configPerguntasFixas() {
    return config_wl.perguntasFixas;
}

function validaRespostas(userId) {
    const data = dataUsersInWL.get(userId);
    data.respondidasCorretamente = data.perguntas.filter((v) => {
        const numResp = parseInt(v.resposta);
        return (v.alternativas[numResp] !== undefined && v.alternativas[numResp].resposta == true);
    });
    return data.respondidasCorretamente.length >= config_wl.minimoAcertos;
}

module.exports = wl;
