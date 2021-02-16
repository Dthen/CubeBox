const tryUnarchiveChannel = (channel, db, checkIfChannelShouldBeUnarchived, moveChannelToCategory, unarchivingChannel) => {
    checkIfChannelShouldBeUnarchived(channel)
        .then(channelShouldBeUnarchived => {
            if (channelShouldBeUnarchived) {
                const channelToBeUnArchived = db.get('channels')
                    .find({ id: channel.id })
                    .value();

                if (channelToBeUnArchived && channelToBeUnArchived.parent) {
                    moveChannelToCategory(
                        channel,
                        channelToBeUnArchived.parent,
                        unarchivingChannel(channel)
                    );
                }
            }
        });
}
module.exports = tryUnarchiveChannel;