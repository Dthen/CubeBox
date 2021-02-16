const Discord = require('discord.js');
const FileSync = require('lowdb/adapters/FileSync');
const low = require('lowdb');
const config = require('../config/archivist.json');
const getChannelById = require('./getChannelById');
const getLastUserMessage = require('./getLastUserMessage')
const adapter = new FileSync('./db/archivist.json');
const db = low(adapter);
const messageChannel = getLastUserMessage(0));

// Initiate Arrchive database
db.defaults({ timeStamp: Date.now(), channels: [] })
    .write();


// Check for ignored channels.
const ignoredChannelIDs = [...config.ignoredChannelIDs, config.errorChannelID];
const isIgnoredChannel = (channel) => {
    // channel doesn't have parent
    // channel id is ignored
    // or channels parent is ignored
    if( !channel.parent ||
        ignoredChannelIDs.includes(channel.id) ||
        ignoredChannelIDs.includes(channel.parentID)
    ) 
    //Do not move ignored channels.
    return console.log(`Ignored channnel ${channel.name} not moved to archive.`);
};

const messages = {
    archivingChannel(channel) {
        return (console.log(`"${channel.name}" not updated for ${config.expirationPeriod.label}. Archiving.`));
    },
    unarchivingChannel(channel) {
        console.log(`"${channel.name} has been resurrected. Unarchiving.`);
        return(console.log(`"${channel.name}" not updated for ${config.expirationPeriod.label}. Archiving.`));
    }
};

/**
 * @param {Discord.Guild} guild
 * @returns {Discord.Collection<string, Discord.TextChannel>}
 */
const getTextChannels = guild => {
    return guild.channels.cache.filter(channel => channel.type === 'text');
};



/** @param {Discord.TextChannel} channel */
const checkIfChannelShouldBeArchived = channel => {
    return getLastUserMessage(channel)
        .then(lastMessage => {
            if (lastMessage === 'noUserMessage') {
                console.log(`#${channel.name} is empty.`);
                return false;
            }
            const lastUpdated = lastMessage.editedTimestamp || lastMessage.createdTimestamp;
            const timeDiff = Date.now() - lastUpdated;
            return timeDiff >= config.expirationPeriod.duration;
        });
};

/** @param {Discord.TextChannel} channel */
const checkIfChannelShouldBeUnarchived = channel => {
    return getLastUserMessage(channel)
        .then(lastMessage => {
            if (lastMessage === 'noUserMessage') {
                console.log(`No activity returned for` + `\x1b[36m%s\x1b[0m', ${channel.name}.'` + `Skipping unarchive check.`);
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
        const errorChannel = getChannelById(channel.guild, config.errorChannelID);  
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
    if (!channel.parent){
    return        
    }
    if (channel.parentID !== archiveCategory.id) {
        data.parent = channel.parent.id;
    } else {
        let noChannelParent =  `Channel "${channel.name}" appears to be in the "${archiveCategory.name}" category. Please move "${channel.name}" to the right category.`
        console.log(noChannelParent)
            //This should also PM the admin role users, but for now let's just tell it to PM Dthen.
            channel.guild.members.cache.find(member => member.id === "149619896395759616").send(noChannelParent)
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
        console.log(`Channel #${channel.name} is already in archive and cannot be updated.`);
        //This should probably check once a week or day or so just in case. Caretaking.
        return;
    }

    const channelInDb = db.get('channels').find({ id: channel.id });

    /**
     * If channel has the correct parent, we have nothing to update.
     */
    const channelHasCorrectParent = channel.parentID === channelInDb.value().parent;
    //if it is making this check while it's in the archive it's going to set the archive to its parent after 2 expiration periods.
    if (channelHasCorrectParent) {
        return;
    }

    console.log(`Channel "${channel.name}" is in the new parent channel (category) "${channel.parent.name}". Updating db to reflect.`);
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
        .filter(channel => !isIgnoredChannel(channel))
		.forEach(channel => {
            if (                
                channel.parentID !== config.archiveCategoryID
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
                            const channelToBeUnArchived = db.get({ id: channel.id }).value();
                            if (channelToBeUnArchived && channelToBeUnArchived.parent) {
                                moveChannelToCategory(
                                    channel,
                                    channelToBeUnArchived.parent,
                                    messages.unarchivingChannel(channel.name)
                                );
                            }
                        }
                    });
            }
        });
        db.set('timeStamp', Date.now())
        .write()
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

    setInterval(()=> updateAllChannels(guild), config.interval)

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

    if (channel.type != 'text' || isIgnoredChannel(channel)) {
        return(false);
    }

    checkIfChannelShouldBeUnarchived(channel)
        .then(channelShouldBeUnarchived => {
            if (channelShouldBeUnarchived) {
                const channelToBeUnArchived = db.get({ id: channel.id }).value();
                if (channelToBeUnArchived && channelToBeUnArchived.parent) {
                    moveChannelToCategory(
                        channel,
                        channelToBeUnArchived.parent,
                        messages.unarchivingChannel(channel.name)
                    );
                }
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
