const { modRoleName } = require('../config.json');
module.exports = {
	name: 'restart',
	description: 'Restarts the bot',
	args: false,
	cooldown: 60,
	execute(message, args) {
		//Get Mod role from mod role name
	const modRole = message.guild.roles.cache.find(r => r.name === modRoleName);
	if (!message.member.roles.cache.some(role =>role === modRole)) {
	return message.reply('You\'re not allowed to do that.');
	return;
	}
	message.reply('Restarting ...');
	process.exit();
	}
}
