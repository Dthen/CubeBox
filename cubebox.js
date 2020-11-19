//Import native mode modules
const fs = require('fs');
const Discord = require('discord.js');
const { prefix, greeting, rolesChannelName, rolesMessage, welcomeChannelName, roles, id, rolesChannelId } = require('./config.json');
const dotenv = require('dotenv');
dotenv.config();
const cooldowns = new Discord.Collection();
const client = new Discord.client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'ROLE'] });


client.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
	
//import internal dependencies
const greeter = require ('./greeter.js');

}

client.once('ready', () => {
	console.log('Logged in.');

	//React to the reaction message with each of the reactions which modify roles so that the button is always present for users.
	client.channels.fetch(rolesChannelId) 
		.then (channel => channel.fetch(rolesMessage))
		.then (message => Object.keys(roles).forEach(role => message.react(role)));
});


//Greeting new members
client.on('guildMemberAdd'), greeter;
	

	



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

	//Only respond to reactions on the correct message
	if (messageReaction.message.id != rolesMessage) return;
	
	//Check client has permission to manage roles
	if (!messageReaction.message.guild.me.hasPermission('MANAGE_ROLES')) return user.send('I\'m not allowed to change your role.');

	//Fetch GuildMember from User
	const emojiUser = messageReaction.message.guild.members.cache.find(member => member.id === user.id);

	//Check the user adding the reaction is not the bot so the bot doesn't change its own roles.
	if (emojiUser.id === id) return;

	//Get role's name from used emoji
	const emojiRoleName = roles[messageReaction.emoji.name];

	//Get role's ID from name
	const emojiRole = messageReaction.message.guild.roles.cache.find(r => r.name === emojiRoleName);

	//Don't try to add roles which don't exist
	if (!emojiRole) return;
	
	//Add the role and inform the user
	emojiUser.roles.add(emojiRole);
	user.send(`You are now one of the ${emojiRoleName}.`);
});

//Removing reaction roles
client.on('messageReactionRemove', (messageReaction, user) => {
	
	//Only respond to reactions on the correct message
	if (messageReaction.message.id != rolesMessage)	return;

	//Check client has permission to manage roles
	if (!messageReaction.message.guild.me.hasPermission('MANAGE_ROLES')) return user.send('I\'m not allowed to change your role.');

	// Fetch GuildMember from User	
	const emojiUser = messageReaction.message.guild.members.cache.find(member => member.id === user.id);

	//Check the user adding the reaction is not the bot so the bot doesn't change its own roles.
	if (emojiUser.id === id) return;

	//Get role's name from used emoji
	const emojiRoleName = roles[messageReaction.emoji.name];

	//Get role's ID from name
	const emojiRole = messageReaction.message.guild.roles.cache.find(r => r.name === emojiRoleName);

	//Don't try to remove roles which don't exist
	if (!emojiRole) return;

	//Remove the role and inform the user
	emojiUser.roles.remove(emojiRole);
	user.send(`You are no longer one of the ${emojiRoleName}.`);

});

//Log in to Discord
client.login(process.env.token);

