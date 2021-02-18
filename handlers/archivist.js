const Discord = require('discord.js');
const FileSync = require('lowdb/adapters/FileSync');
const low = require('lowdb');
const config = require('../config/archivist.json');
const getChannelById = require('./getChannelById');
const tryUnarchiveChannel = require('./tryUnarchiveChannel')
const getLastUserMessage = require('./getLastUserMessage')
const adapter = new FileSync('./db/archivist.json');
const db = low(adapter);
// Initiate Archive database
db.defaults({ timeStamp: Date.now(), channels: [] })
    .write();


// Check for ignored channels.
const ignoredChannelIDs = [...config.ignoredChannelIDs, config.errorChannelID];
const isIgnoredChannel = (channel) => {
    if (
        ignoredChannelIDs.includes(channel.id) || // Channel is ignored directly
        ignoredChannelIDs.includes(channel.parentID) || // Channel is ignored through parent
        !channel.parent // Channel doesn't have a parent
    ) {
        console.log(`Ignored channnel ${channel.name} not moved to archive.`);
        return true;
    }

    return false;
};

const messages = {
    archivingChannel(channel) {
        return (console.log(`"${channel.name}" quiet for ${config.expirationPeriod.label}. Auto-archiving.`));
    },
    
    unarchivingChannel(channel) {
        console.log(`Reviving "${channel.name}".`)
        return(true);
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
                console.log(`No messages. "#${channel.name}" is empty.`);
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
                console.log(`No activity returned for ${channel.name}. Skipping unarchive check.`);
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
        const errorMessage = `Could not find parent channel for channel ${channel.name}`;
        const errorChannel = getChannelById(channel.guild, config.errorChannelID);
        errorChannel.reply(errorMessage);
        throw new Error(errorMessage);
    }



    return channel.setParent(parentChannel, { reason, lockPermissions: false })
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
        const noChannelParent =  `Channel "${channel.name}" appears to be in the "${archiveCategory.name}" category. Please move "${channel.name}" to the right category.`
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
        return;
    }

    const channelInDb = db
        .get('channels')
        .find({id : channel.id});

    if (!channelInDb.value()) {
        addChannelToDb(channel)
    }


    /**
     * If channel has the correct parent, we have nothing to update.
     */
    const channelFromDb = db.get('channels').find({ id: channel.id }).value()
    const channelHasCorrectParent = channelFromDb && channel.parentId === channelFromDb.parent


    /** @todo if it is making this check while it's in the archive it's going to set the archive to its parent after 2 expiration periods. */
    if (channelHasCorrectParent) {
        return
    }

    if (channel.parent) {console.log(`Channel "${channel.name}" is in the new parent channel (category) "${channel.parent.name}". Updating db to reflect.`)}
    else {console.log(`Channel "${channel.name}" is not categorised.`)}

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
                                messages.archivingChannel(channel)
                            );
                        }
                    });
            } else {
                tryUnarchiveChannel(channel, db, checkIfChannelShouldBeUnarchived, moveChannelToCategory, messages.unarchivingChannel);
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

    tryUnarchiveChannel(channel, db, checkIfChannelShouldBeUnarchived, moveChannelToCategory, messages.unarchivingChannel);
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
