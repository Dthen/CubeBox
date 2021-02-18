const { modRoleName } = require('../config/moderation.json');
module.exports = {
	name: 'restart',
	description: 'Restarts the bot',
	args: false,
	cooldown: 60,
	execute(message, args) {
		//Get Mod role from mod role name
		const modRole = message.guild.roles.cache.find(r => r.name === modRoleName);
		//Check the user has moderator permissions
		if (!message.member.roles.cache.has(modRole.id)) {
			return message.reply('You\'re not allowed to do that.')
		}
		message.reply('Restarting ...').then(() => {
			console.log('Ready to exit...');
			message.client.destroy();
			process.exit();
		  });
	}
}