const { modRoleName, adminRoleName } = require(`./config/moderation.json.`);
(modRoleName, adminRoleName) => {
    mods = (message.guild.roles.cache.find(r => r.name ===  modRoleName))
    admins = (message.guild.roles.cache.find(r => r.name === adminRoleName))
module.exports  = 
            message.reply(`Admins: ${admins}`)
            message.reply(`Mods: ${mods}`)
}