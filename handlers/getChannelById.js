/**
 * @param {Discord.Guild} guild
 * @param {string} id
 */
const getChannelById = (guild, id) => {
    return guild.channels.cache.find(channel => channel.id === id);
};
