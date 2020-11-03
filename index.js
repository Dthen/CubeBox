const fs = require('fs');
const Discord = require('discord.js');
const { prefix, greeting, rolesChannelName, rolesMessage, welcomeChannelName, roles } = require('./config.json');
const dotenv = require('dotenv');
dotenv.config();

const cooldowns = new Discord.Collection();
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'ROLE'] });
client.commands = new Discord.Collection()

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
	console.log('Logged in.');
	//React to the reaction message with each of the reactions which modify roles so that the button is always present for users.
	Object.keys(roles).forEach(role => rolesMessage.react(role));
});


//Greeting new members
client.on('guildMemberAdd', member => {
	//Fetch channel IDs from names
	const rolesChannel = member.guild.channels.cache.find(r => r.name === rolesChannelName);
	const welcomeChannel= member.guild.channels.cache.find(r => r.name === welcomeChannelName);
		//Prepare formatting for welcome message.
	const greetingMessage = greeting
	.replace(/\${member}/g, member)
	.replace(/\${rolesChannelName}/g, rolesChannel);
	//Check the channel exists
	if (!welcomeChannel) return;
	//Greet the new user
	welcomeChannel.send(greetingMessage);
});

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

//Adding reaction roles
client.on('messageReactionAdd', (messageReaction, user) => {
	//Check CubeBox has permission to manage roles
	if (!messageReaction.message.guild.me.hasPermission('MANAGE_ROLES')) return user.send('I\'m not allowed to change your role.');
	//Fetch GuildMember from User
	const emojiUser = messageReaction.message.guild.members.cache.find(member => member.id === user.id);
	//Get role's name from used emoji
	const emojiRoleName = roles[messageReaction.emoji.name];
	//Get role's ID from name
	const emojiRole = messageReaction.message.guild.roles.cache.find(r => r.name === emojiRoleName);
	//Only respond to reactions on the correct message
	if (messageReaction.message.id != rolesMessage){
		return;
	}
	//Don't try to add roles which don't exist
	if (!emojiRole) {
		return;
	}
	//Add the role
	emojiUser.roles.add(emojiRole);
	user.send(`You are now one of the ${emojiRoleName}.`);
});
//Removing reaction rolesis 
client.on('messageReactionRemove', (messageReaction, user) => {
	//Check CubeBox has permission to manage roles
	if (!messageReaction.message.guild.me.hasPermission('MANAGE_ROLES')) return user.send('I\'m not allowed to change your role.');
	// Fetch GuildMember from User
	const emojiUser = messageReaction.message.guild.members.cache.find(member => member.id === user.id);
	//Get role's name from used emoji
	const emojiRoleName = roles[messageReaction.emoji.name];
	//Get role's ID from name
	const emojiRole = messageReaction.message.guild.roles.cache.find(r => r.name === emojiRoleName);
	//Only respond to reactions on the correct message
	if (messageReaction.message.id != rolesMessage){
		return;
	}
	//Don't try to remove roles which don't exist
	if (!emojiRole) {
		return;
	}
	//Remove the role
	emojiUser.roles.remove(emojiRole);
user.send(`You are no longer one of the ${emojiRoleName}.`);
});


client.login(process.env.token);

