const {greeting, rolesChannelName, welcomeChannelName, } = require('../config/config.json');
module.exports = (member) => {
	console.log('running greeter.js')
	console.log(member)


	//Fetch channel IDs from names
	const rolesChannel = member.guild.channels.cache.find(r => r.name === rolesChannelName);
	const welcomeChannel= member.guild.channels.cache.find(r => r.name === welcomeChannelName);
	console.log('fetching channels')

	//Check the channel exists
	if (!welcomeChannel || !rolesChannel) {
		console.log('no Welcome channel')
		return;
	}
	
	//Prepare formatting for welcome message.
	const greetingMessage = greeting
		.replace(/\${member}/g, member)
		.replace(/\${rolesChannelName}/g, rolesChannel);
		console.log('greeting message formatted')

	//Greet the new user
	welcomeChannel.send(greetingMessage);
	console.log(`greeted new user`)
}