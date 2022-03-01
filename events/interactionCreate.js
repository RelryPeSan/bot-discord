const client = require("../index");
const whitelist = require('../whitelist/wl');

client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
        if(interaction.customId.includes("message-confirmation")) {
            client.mc.responseMessage(interaction);
        } else {
            switch(interaction.customId) {
                case "init-wl":
                    await whitelist.createChannel(interaction);
                    break;
    
                case "finished-wl":
                    await whitelist.confirmButtonWL(interaction);
                    break;
            }
        }
    } else if (interaction.isSelectMenu()) {
        if(interaction.customId.includes("select-menu-wl-")) {
            await whitelist.receiveSelectMenuWL(interaction);
            await interaction.deferUpdate();
        }
    } else if (interaction.isCommand()) {
        await interaction
            .reply({ content: "Processando comando...", ephemeral: true })
            .catch(() => {});

        const cmd = client.slashCommands.get(interaction.commandName);
        if (!cmd)
            return interaction.followUp({content: "Este comando não existe!"});
        
        const args = [];

        for (let option of interaction.options.data) {
            if (option.type === "SUB_COMMAND") {
                if (option.name) args.push(option.name);
                option.options?.forEach((x) => {
                    if (x.value) args.push(x.value);
                })
            } else if (option.value) args.push(option.value);
        }
        
        interaction.member = interaction.guild.members.cache.get(interaction.user.id);

        cmd.run(client, interaction, args);
    }
});