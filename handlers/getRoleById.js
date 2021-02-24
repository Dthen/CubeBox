/**
 * @param {Discord.Guild} guild
 * @param {string} id
 */
module.exports = (guild, id) => {
    return guild.roles.cache.find(role => role.id === id);
};