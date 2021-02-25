/**
 * @param {Discord.Guild} guild
 * @param {string} id
 */

module.exports = (guild, id) => {
    return guild.members.cache.find(member => member.id === id);
};
