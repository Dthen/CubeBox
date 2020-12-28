const { moveChannelToCategory } = require('../handlers/archivist');

module.exports = {
    name: 'archivist',
	description: `Manage channel archival.`,
	usage: 'set [channel name] [category name]',
	cooldown: 5,
	execute(message, args) {
		const [ command, ...restOfTheArgs ] = args;
		const { guild } = message;

		if (command === 'set') {
			const [channelName, ...parentCategoryParts] = restOfTheArgs;
			const channelToUpdate = guild.channels.cache.find(channel => channel.name.toLowerCase() === channelName.toLowerCase());
			const parentCategory = parentCategoryParts.join(' ');

			moveChannelToCategory(channelToUpdate, parentCategory);
		}
	},
}
