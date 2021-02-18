const { modRoleName, adminRoleName } = require('../config/moderation.json');
module.exports = (guildMember) => {
    return guildMember.roles.cache.some(r => r.name === modRoleName || r.name === adminRoleName);
}
            