const Discord = require('discord.js');
const FileSync = require('lowdb/adapters/FileSync');
const low = require('lowdb');
const config = require('../config/archivist.json');
const getChannelById = require('./getChannelById');

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

//This is where to get CubeBox to ignore its own messages.
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
            if (!lastMessage) {
                console.log(`No message returned for ${channel.name}. Skipping archive check.`);
                return false;
            }

            const lastUpdated = lastMessage.editedTimestamp || lastMessage.createdTimestamp;
            const timeDiff = Date.now() - lastUpdated;
            return timeDiff >= config.expirationPeriod.duration;
        });
};

/** @param {Discord.TextChannel} channel */
const checkIfChannelShouldBeUnarchived = channel => {
    return getLastMessageInChannel(channel)
        .then(lastMessage => {
            if (!lastMessage) {
                console.log(`No message returned for ${channel.name}. Skipping unarchive check.`);
                return false;
            }

            const lastUpdated = lastMessage.editedTimestamp || lastMessage.createdTimestamp;
            const timeDiff = Date.now() - lastUpdated;
            return timeDiff < config.expirationPeriod.duration;
        });
};

/**
 * @param {Discord.Guild} guild
 * @param {string} category
 */
const getCategoryChannel = (guild, category) => {
    return guild.channels.cache
        .filter(guildChannel => guildChannel.type === 'category')
        .find(guildChannel => guildChannel.id === category);
}

/**
 * @param {Discord.GuildChannel} channel Channel to move.
 * @param {string} parentID ID of parent channel to move channel to.
 * @param {string} [reason]
 */
const moveChannelToCategory = (channel, parentID, reason = 'Commanded to move channel by Archivist.') => {
    const parentChannel = getCategoryChannel(channel.guild, parentID);

    if (!parentChannel) {
        const errorChannel = getChannelbyId(channel.guild, config.errorChannelID);  
        errorChannel.reply(`Could not find parent channel for channel ${channel.name}`);
        throw new Error(`Could not find parent channel for channel ${channel.name}`);
    }



    return channel.setParent(parentChannel, { reason })
        .then(() => console.log(reason, `Moved ${channel.name} to ${parentChannel.name}.`))
		.catch(console.error);
};

/** @param {Discord.TextChannel} channel */
const addChannelToDb = channel => {
    const archiveCategory = getCategoryChannel(channel.guild, config.archiveCategoryID);
    const data = {
        id: channel.id,
        name: channel.name,
    };

    if (channel.parentID !== archiveCategory.id) {
        data.parent = channel.parent.id;
    } else {
        let noChannelParent =  `Channel "${channel.name}" appears to be in the "${archiveCategory.name}" category. Please move "${channel.name}" to the right category.`
        console.log(noChannelParent)
            //This should also PM the admin role users, but for now let's just tell it to PM Dthen.
            channel.guild.members.cache.find(member => member.id === 149619896395759616).send(noChannelParent)
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
    const archiveCategory = getCategoryChannel(channel.guild, config.archiveCategoryID);
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

    console.log(`Channel "${channel.name}" is in the new parent channel (category) "${channel.parent.name}". Updating db to reflect.`);
    channelInDb.assign({ parent: channel.parentID }).write();
}

/** @param {Discord.Guild} guild */
// This is just somethign fancy Dave added to make his autocomplete work better.
const updateAllChannels = guild => {
    const textChannels = getTextChannels(guild);

    if (textChannels.size === 0) {
        console.log('No archivable channels found.');
        return;
    }

	textChannels
        .filter(channel => !config.ignoredChannelIDs.some(ignoredChannelID =>
            channel.id === ignoredChannelID ||
            channel.parent.id === ignoredChannelID
          ))

        
        // The above two lines can be simplified.
		.forEach(channel => {
            if (!channel.parent) return
            if (                
                channel.parent.id !== config.archiveCategoryID
            ) {
                checkIfChannelShouldBeArchived(channel)
                    .then(channelShouldBeArchived => {
                        if (channelShouldBeArchived) {
                            moveChannelToCategory(
                                channel,
                                config.archiveCategoryID,
                                messages.archivingChannel(channel.name)
                            );
                        }
                    });
            } else {
                checkIfChannelShouldBeUnarchived(channel)
                    .then(channelShouldBeUnarchived => {
                        if (channelShouldBeUnarchived) {
                            let channelToBeUnArchived = db.get({id:channel.id}).value()
                            moveChannelToCategory(
                                channel,
                                channelToBeUnArchived.parent,
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

    textChannels
        .forEach(channel => {
            const channelInDb = channelsInDb.some({ id:channel.id }).value();
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

    if (channel.type !== 'text' || !config.ignoredChannelIDs.some(ignoredChannelID =>
        channel.id === ignoredChannelID ||
        channel.parent.id === ignoredChannelID
      )) {
        return;
    }

    checkIfChannelShouldBeUnarchived(channel)
        .then(channelShouldBeUnarchived => {
            if (channelShouldBeUnarchived) {
                moveChannelToCategory(
                    channel,
                    config.archiveCategoryID,
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
