const { modRoleName } = require('../config.json');
module.exports = {
	name: 'purge',
	description: 'Mass-deletes messages from a channel.',
	args: true,
	cooldown: 10,
		execute(message, args) {
		//Get Mod role from mod role name
		const modRole = message.guild.roles.cache.find(r => r.name === modRoleName);

		//Check the user has moderator permissions
		if (!message.member.roles.cache.has(modRole.id)) {
			return message.reply('You\'re not allowed to do that.')
		}
		//Command goes here
		message.textchannel.bulkDelete(args);
	}
}