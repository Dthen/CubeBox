const getChannelById = require('./getChannelbyId');
const greeterOn = require('../config/config.json');
const {greeting, welcomeChannelId, greeterRoleName, useGreeterRole, useRulesChannel, useRolesChannel } = require('../config/greeter.json');
const log = require('./logger.js');

module.exports = (guild, member) => {
	if (greeterOn){
		//Fetch channel from name
		const welcomeChannel = getChannelById(guild,welcomeChannelId);

		//Check the channel exists
		if (!welcomeChannel) {
			log('Unable to greet new user: no welcome channel');
			return;
		}

		
		
		//Prepare formatting for welcome message.
		const greetingMessage = greeting
			.replace(/\${member}/g, member)
			if (useRulesChannel) {
				const rulesChannelId = require('../config/moderation.json;');
				const rulesChannel = getChannelById(guild, rulesChannelId);
				greetingMessage.replace(/\${rolesChannelName}/g, rulesChannel)
			}
			if (useRolesChannel){
				const rolesChannelId = require('../config/reactionRoles.json;');
				const rolesChannel = getChannelById(guild, rolesChannelId);
				greetingMessage.replace(/\${rolesChannelName}/g, rolesChannel);
			}
			if (useGreeterRole) {
				const greeterRoleName = member.guild.roles.cache.find(r => r.id === greeterRoleId).name;
				greetingMessage.replace(/\${greeterRoleName}/g, greeterRoleName);
			}

		//Greet the new user
		welcomeChannel.send(greetingMessage);
		log(`greeted new user: ` + member.displayName);
	}
}