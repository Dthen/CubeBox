const { modRoleName } = require('../config/moderation.json');
module.exports = {
	name: 'purge',
	description: 'Mass-deletes messages from a channel.',
	args: false,
	cooldown: 10,
		execute(message) {
		//Get list of mods
		let mods = [0]
		mods = message.guild.roles.cache.find(r => r.name === modRoleName);
		let admins = message.guild.roles.cache.find(r => r.name === adminRoleName);
		//Check the user has moderator permissions
		if (!message.member.roles.cache.has(modRole.id)) {
			return message.reply('You\'re not allowed to do that.')
		}
		//Command goes here
		message.channel.bulkDelete(args[0]);
	}
}