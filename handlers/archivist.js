const Discord = require('discord.js');
const FileSync = require('lowdb/adapters/FileSync');
const low = require('lowdb');
const config = require('../config/archivist.json');

const adapter = new FileSync('./db/archivist.json');
const db = low(adapter);

db.defaults({ channels: [] })
    .write();

const messages = {
    archivingChannel(channelName) {
        return `Channel "${channelName}" not updated for ${config.expirationPeriod.label}. Archiving.`;
    },
    unarchivingChannel(channelName) {
        return `Channel "${channelName}" updated within the last ${config.expirationPeriod.label}. Unarchiving.`;
    }
};

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
 * @param {Discord.Guild} guild
 * @param {string} id
 */
const getChannelById = (guild, id) => {
    return guild.channels.cache.find(channel => channel.id === id);
}

/**
 * @param {Discord.Guild} guild
 * @param {string} category
 */
const getCategoryChannel = (guild, category) => {
    return guild.channels.cache
        .filter(guildChannel => guildChannel.type === 'category')
        .find(guildChannel => guildChannel.name.toLowerCase() === category.toLowerCase());
}

/**
 * @param {Discord.GuildChannel} channel Channel to move.
 * @param {string} parent Parent to move channel to. Name, or actual channel.
 * @param {string} [reason]
 */
const moveChannelToCategory = (channel, parent, reason = 'Commanded to move channel by Archivist.') => {
    const parentChannel = getCategoryChannel(channel.guild, parent);

    if (!parentChannel) {
        throw new Error(`Could not find parent channel`);
    }

    return channel.setParent(parentChannel, { reason })
        .then(() => console.log(reason, `Moved ${channel.name} to ${parent}.`))
		.catch(console.error);
};

/** @param {Discord.TextChannel} channel */
const addChannelToDb = channel => {
    const archiveCategory = getCategoryChannel(channel.guild, config.archiveCategory);
    const data = {
        id: channel.id,
        name: channel.name,
    };

    if (channel.parentID !== archiveCategory.id) {
        data.parent = channel.parent.id;
    } else {
        console.log(
            `Channel "${associatedChannel.name}" appears to be in the "${archiveCategory.name}" category. Please set an appropriate default category.`
        );
    }

    db
        .get('channels')
        .push(data)
        .write();
    console.log(`Added ${channel.name} to DB.`);
};

/** @param {Discord.TextChannel} channel */
const removeChannelFromDb = channel => {
    db
        .get('channels')
        .remove({ id: channel.id })
        .write();
    console.log(`Removed ${channel.name} from DB.`);
}

/** @param {Discord.TextChannel} channel */
const updateChannelInDb = channel => {
    const archiveCategory = getCategoryChannel(channel.guild, config.archiveCategory);
    const channelIsInArchive = channel.parentID === archiveCategory.id;

    /**
     * If channel is in archive, we have nothing to update.
     */
    if (channelIsInArchive) {
        console.log(`Channel "${channel.name}" is already in archive and cannot be updated.`);
        return;
    }

    const channelInDb = db.get('channels').find({ id: channel.id });

    /**
     * If channel has the correct parent, we have nothing to update.
     */
    const channelHasCorrectParent = channel.parentID === channelInDb.value().parent;
    if (channelHasCorrectParent) {
        return;
    }

    console.log(`Channel "${channel.name}" is in the new parent channel "${channel.parent.name}". Updating db to reflect.`);
    channelInDb.assign({ parent: channel.parentID }).write();
}

/** @param {Discord.Guild} guild */
const updateAllChannels = guild => {
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
                                messages.archivingChannel(channel.name)
                            );
                        }
                    });
            } else {
                checkIfChannelShouldBeUnarchived(channel)
                    .then(channelShouldBeUnarchived => {
                        if (channelShouldBeUnarchived) {
                            moveChannelToCategory(
                                channel,
                                config.archiveCategory,
                                messages.unarchivingChannel(channel.name)
                            );
                        }
                    });
            }
		});
};

/** @param {Discord.Guild} guild */
const init = guild => {
    const textChannels = getTextChannels(guild);
    const textChannelIds = textChannels.map(channel => channel.id);
    const channelsInDb = db.get('channels');

    /**
     * If a channel is in the db but not on the server,
     * delete from the db.
     */
    channelsInDb
        .remove(channel => !textChannelIds.includes(channel.id))
        .write();

    textChannelIds
        .forEach(id => {
            const channel = getChannelById(guild, id);
            const channelInDb = channelsInDb.some({ id }).value();

            /**
             * If a channel is on the server but not in the db,
             * write to the db.
             *
             * Otherwise, ensure the parent category is up to date.
             */
            if (!channelInDb) {
                addChannelToDb(channel);
            } else {
                updateChannelInDb(channel);
            }
        });

    updateAllChannels(guild);
};

/** @param {Discord.GuildChannel} channel */
const handleChannelCreate = channel => {
    if (channel.type !== 'text') {
        return;
	}

    addChannelToDb(channel);
};

/** @param {Discord.GuildChannel} channel */
const handleChannelDelete = channel => {
    if (channel.type !== 'text') {
        return;
	}

	removeChannelFromDb(channel);
};

/**
 * @param {Discord.GuildChannel} oldChannel
 * @param {Discord.GuildChannel} newChannel
 */
const handleChannelUpdate = (oldChannel, newChannel) => {
	if (newChannel.type !== 'text') {
		return;
	}

	updateChannelInDb(newChannel);
};

/** @param {Discord.Message} message */
const handleMessage = message => {
    const { channel } = message;

    if (channel.type !== 'text') {
        return;
    }

    checkIfChannelShouldBeUnarchived(channel)
        .then(channelShouldBeUnarchived => {
            if (channelShouldBeUnarchived) {
                moveChannelToCategory(
                    channel,
                    config.archiveCategory,
                    messages.unarchivingChannel(channel.name)
                );
            }
        });
};

module.exports = {
    handleChannelCreate,
    handleChannelDelete,
    handleChannelUpdate,
    handleMessage,
    init,
    moveChannelToCategory,
    updateAllChannels,
    updateChannelInDb,
};
