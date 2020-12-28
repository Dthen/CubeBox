const Discord = require('discord.js');
const config = require('../config/archivist.json');

/**
 * @param {Discord.Guild} guild
 * @returns {Discord.Collection<string, Discord.TextChannel>}
 */
const getTextChannels = guild => {
    return guild.channels.cache.filter(channel => channel.type === 'text');
};

/**
 * @param {Discord.TextChannel} channel
 * @returns {Promise<Discord.Message>}
 */
const getLastMessageInChannel = channel => {
    return new Promise(resolve => {
        const { lastMessage } = channel;
        if (lastMessage) {
            return resolve(lastMessage);
        }

        return channel.messages
            .fetch({ limit: 1 })
            .then(collection => resolve(collection.first()));
    })
};

/** @param {Discord.TextChannel} channel */
const checkIfChannelShouldBeArchived = channel => {
    return getLastMessageInChannel(channel)
        .then(lastMessage => {
            const lastUpdated = lastMessage.editedTimestamp || lastMessage.createdTimestamp;
            const timeDiff = Date.now() - lastUpdated;
            return timeDiff >= config.expirationPeriod.duration;
        });
};

/** @param {Discord.TextChannel} channel */
const checkIfChannelShouldBeUnarchived = channel => {
    return getLastMessageInChannel(channel)
        .then(lastMessage => {
            const lastUpdated = lastMessage.editedTimestamp || lastMessage.createdTimestamp;
            const timeDiff = Date.now() - lastUpdated;
            return timeDiff < config.expirationPeriod.duration;
        });
};

/**
 * @param {Discord.GuildChannel} channel Channel to move.
 * @param {string} parent Parent to move channel to. Name, or actual channel.
 * @param {string} [reason]
 */
const moveChannelToCategory = (channel, parent, reason = 'Commanded to move channel by Archivist.') => {
    const parentChannel = channel.guild.channels.cache
        .filter(guildChannel => guildChannel.type === 'category')
        .find(guildChannel => guildChannel.name.toLowerCase() === parent.toLowerCase());

    if (!parentChannel) {
        throw new Error(`Could not find parent channel`);
    }

    return channel.setParent(parentChannel, { reason })
        .then(() => console.log(reason, `Moved ${channel.name} to ${parent}.`))
		.catch(console.error);
}

/** @param {Discord.Guild} guild */
const archiveChannels = guild => {
    const textChannels = getTextChannels(guild);

    if (textChannels.size === 0) {
        console.log('No archivable channels found.');
        return;
    }

	textChannels
		.filter(channel => !config.ignoredChannels.includes(channel.name))
		.forEach(channel => {
            if (
                !channel.parent ||
                channel.parent.name.toLowerCase() !== config.archiveCategory.toLowerCase()
            ) {
                checkIfChannelShouldBeArchived(channel)
                    .then(channelShouldBeArchived => {
                        if (channelShouldBeArchived) {
                            moveChannelToCategory(
                                channel,
                                config.archiveCategory,
                                `Channel "${channel.name}" not updated for ${config.expirationPeriod.label}. Archiving.`
                            );
                        }
                    });
            }

            /**
             * @todo Write "getDefaultCategoryName" function for unarchiving channels.
             */

            // checkIfChannelShouldBeUnarchived(channel)
            //     .then(channelShouldBeUnarchived => {
            //         if (channelShouldBeUnarchived) {

            //             moveChannelToCategory(
            //                 channel,
            //                 '', /** @todo Turn into "getDefaultCategoryName function" */
            //                 `Channel "${channel.name}" update in the last ${config.expirationPeriod.label}. Unarchiving.`
            //             );
            //         }
            //     });
		});
}

module.exports = {
    archiveChannels,
    moveChannelToCategory,
};
