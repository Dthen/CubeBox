/**
 * @param {Discord.Guild} guild
 * @param {string} id
 */
module.exports = (guild, id) => {
    return guild.channels.cache.find(channel => channel.id === id);
};
//Wait, is this meant to be passed the guild as a parameter? That's in a config now.