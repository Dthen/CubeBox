module.exports = {
	name: 'discord',
	description: `Links to the Discord server's invite page`,
	cooldown: 5,
	execute(message) {
		message.channel.send('https://discord.thepurplecubes.com/');
	},
};