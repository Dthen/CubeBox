module.exports = {
	name: 'invite',
	description: `Links to the Discord server's invite page`,
	cooldown: 5,
	execute(message, args) {
		message.channel.send('https://discord.thepurplecubes.com/');
	},
};