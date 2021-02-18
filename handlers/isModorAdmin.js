const modRoleName, adminRoleName = require('../config/moderation.json');
module.exports = (message) => {
    if (message.guild.roles.cache.find(r => r.name != modRoleName || adminRoleName)) return (false)
    }
            