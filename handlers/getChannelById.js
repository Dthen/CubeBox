/**
 * @param {Discord.Guild} guild
 * @param {string} id
 */

module.exports = (guild, id) => {
    return guild.channels.cache.find(channel => channel.id === id);
};
