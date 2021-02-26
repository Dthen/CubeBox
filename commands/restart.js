const {modRoleId, adminRoleId} = require('../config/moderation.json');
module.exports = {
	name: 'restart',
	description: 'Restarts the bot',
	args: false,
	cooldown: 60,
	execute(message, client) {
		//Check the user has moderator permissions
		if (!message.member.roles.cache.has(modRoleId || adminRoleId) ) {
			return message.reply('You\'re not allowed to do that.')
		}
		message.reply('Restarting ...').then(() => {
			log('Restart command issued, preparing to exit process');
			client.destroy();
			process.exit();
		  });
	}
}