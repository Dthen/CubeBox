module.exports = {
	name: 'issue',
	description: `Links to the bot's Github Repository's issue tracker`,
	cooldown: 5,
	execute(message, args) {
		message.channel.send('https://github.com/Dthen/CubeBox/issues');
	},
};