const {greeting, rolesChannelName, welcomeChannelName, } = require('./config.json');
module.exports = (member) => {
	
	//Fetch channel IDs from names
	const rolesChannel = member.guild.channels.cache.find(r => r.name === rolesChannelName);
	const welcomeChannel= member.guild.channels.cache.find(r => r.name === welcomeChannelName);

	//Check the channel exists
	if (!welcomeChannel || !rolesChannel) return;
	
	//Prepare formatting for welcome message.
	const greetingMessage = greeting
		.replace(/\${member}/g, member)
		.replace(/\${rolesChannelName}/g, rolesChannel);

	//Greet the new user
    welcomeChannel.send(greetingMessage);
}