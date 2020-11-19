module.exports = {
	name: 'github',
	description: `Links to the bot's Github Repository`,
	cooldown: 5,
	execute(message, args) {
		message.channel.send('https://github.com/Dthen/CubeBox');
	},
};