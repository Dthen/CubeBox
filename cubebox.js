//Import native Node modules
const fs = require('fs');
const Discord = require('discord.js');

//Import environment variables
require('dotenv').config();

//import internal dependencies
const greeter = require ('./greeter.js');
const { prefix, greeting, rolesChannelName, rolesMessage, welcomeChannelName, roles, id, rolesChannelId } = require('./config.json');
const rolesreactionhandler = require('./rolesreactionhandler.js');

//Create the bot's Discord client
const client = new Discord.client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'ROLE'] });

//Declare constants for command handler
const cooldowns = new Discord.Collection();

//Import command Files for command handler
client.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

//Log in and get going
client.once('ready', () => {
	console.log('Logged in.');

	//React to the reaction message with each of the reactions which modify roles so that the button is always present for users.
	client.channels.fetch(rolesChannelId) 
		.then (channel => channel.fetch(rolesMessage))
		.then (message => Object.keys(roles).forEach(role => message.react(role)));
});


//Greeting new members
client.on('guildMemberAdd', greeter);	

//Command controller (I haven't really changed this from the example yet)
client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

	if (command.guildOnly && message.channel.type === 'dm') {
		return message.reply('Try again on the server.');
	}

	if (command.args && !args.length) {
		let reply = `No arguments, ${message.author}!`;

		if (command.usage) {
			reply += `\nTry it like this: \`${prefix}${command.name} ${command.usage}\``;
		}

		return message.channel.send(reply);
	}

	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`No. Ask again in ${timeLeft.toFixed(1)} seconds.`);
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('Error: Cubic error - dimensions not equal to 3.');
	}
});

/*
Regarding reactions. Currently these events are only used for roles, but later, when we implement polling, event management,
twitch integration, etc., we may need a sane way of working out which we want. There is also a way to wait for reactions on 
specific messages as well, though, so this may be a non-issue.
*/

//Adding reaction roles
client.on('messageReactionAdd', (messageReaction, user) => {
	try {rolesreactionhandler(messageReaction, user)}
	catch (error) {
		if (error=='noPermissions') user.send('I\'m not allowed to change your role.');
		return;
	}
	//Add the role and inform the user
	emojiUser.roles.add(emojiRole);
	user.send(`You are now one of the ${emojiRoleName}.`);
});
//Removing reaction roles
client.on('messageReactionRemove', (messageReaction, user) => {

	//Remove the role and inform the user
	emojiUser.roles.remove(emojiRole);
	user.send(`You are no longer one of the ${emojiRoleName}.`);

});

//Log in to Discord
client.login(process.env.token);

