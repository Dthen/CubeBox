const getChannelById = require('./getChannelbyId');
const greeterOn = require('../config/config.json');
const {greeting, welcomeChannelId, greeterRoleName, useGreeterRole, useRulesChannel, useRolesChannel } = require('../config/greeter.json');
module.exports = (member) => {
	if (greeterOn){
		//Fetch channel from name
		const welcomeChannel = getChannelById(welcomeChannelId);

		//Check the channel exists
		if (!welcomeChannel) {
			console.log('Unable to greet new user: no welcome channel');
			return;
		}

		
		
		//Prepare formatting for welcome message.
		const greetingMessage = greeting
			.replace(/\${member}/g, member)
			if (useRulesChannel) {
				const rulesChannelId = require('../config/moderation.json;');
				const rulesChannel = getChannelById(rulesChannelId);
				greetingMessage.replace(/\${rolesChannelName}/g, rulesChannel)
			}
			if (useRolesChannel){
				const rolesChannelId = require('../config/reactionRoles.json;');
				const rolesChannel = getChannelById(rolesChannelId);
				greetingMessage.replace(/\${rolesChannelName}/g, rolesChannel);
			}
			if (useGreeterRole) {
				const greeterRole = member.guild.roles.cache.find(r => r.name === greeterRoleName);
				greetingMessage.replace(/\${greeterRoleName}/g, greeterRole);
			}

		//Greet the new user
		welcomeChannel.send(greetingMessage);
		console.log(`greeted new user: ` + member.displayName);
	}
}