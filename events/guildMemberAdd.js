const client = require("../index");
const whitelist = require('../whitelist/wl');

client.on("guildMemberAdd", member => {
    if(!member.user.bot) {
        whitelist.newerMember(member);
    }
});