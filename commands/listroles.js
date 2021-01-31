const Discord = require('discord.js');
module.exports = {
	name: 'roles',
	description: `Lists all users with a specific role`,
	cooldown: 5,
	execute(message, args) {
		//Fetch role from argument
		const roleName = args.join(' ');
		const role = message.guild.roles.cache.find(role => role.name.toLowerCase() === roleName.toLowerCase());
		console.log('Fetched role from argument')
		//Check argument is a role
		if (args.length > 0)
			message.rely('You can only ask to list one role at a time.')
		if (!role){
			message.reply(`Sorry, ${roleName} is not a role`);
			console.log ('User requested to list non-existent role')
			return;
		}
		const embed = new Discord.MessageEmbed()
			.setTitle (`Users with the ${role.name} role`)
			.setDescription (role.members.map(member => member.nickname || member.user.username)
				.join("\n"))
			.setColor(0x553E90)
		// reply wih list of users with the argument role
		message.channel.send(embed)
		console.log('Replied with list of roles')

	},
};