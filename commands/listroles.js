const { GuildMemberManager } = require("discord.js");

const { roles } = require('./config.json');
module.exports = {
	name: 'roles',
	description: `Lists all players of with a specific role`,
	cooldown: 5,
	execute(message, args) {
		let rolesList = message.guild.roles.cache.array
		rolesList.forEach(function(item) {
			
			if (args = item) {
			message.reply('')
			.then(() => console.log(`Listed roles`)) 
			.catch(console.error)
			
			}
		}	
	},
};