const { moveChannelToCategory, updateChannelInDb } = require('../handlers/archivist');

module.exports = {
    name: 'archivist',
	description: 'Move channel to category for archival.',
	usage: 'update [category]',
	cooldown: 5,
	execute(message, args) {
		const [ command, ...parentCategoryParts ] = args;

		if (command === 'update') {
			const parentCategoryName = parentCategoryParts.join(' ');
			const { channel } = message;

			if (parentCategoryName.length > 0) {
				updateChannelInDb(channel);
			} else {
				moveChannelToCategory(channel, parentCategoryName);
			}
		}
	},
}
