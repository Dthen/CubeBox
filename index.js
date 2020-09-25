const fs = require('fs');
const emojiCharacters = require('./emojiCharacters');
const Discord = require('discord.js');
const { prefix, greeting, serverid, roleschannel, rolesmessage, welcomechannel } = require('./config.json');
const dotenv = require('dotenv');
dotenv.config();
⃣
const client = new Discord.Client();
client.commands = new Discord.Collection()

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
	console.log('Logged in.');
	//Fetch the message people will react to choose their role to ensure it is cached and that the watcher will notice new reactions.
	client.guilds.get('serverid').channels.get('roleschannel').fetchMessage('rolesmessage');
	console.log('Roles message cached.')

	//Prepare formatting for welcome message.
	greeting.replace(/\${member}/g, member);
	greeting.replace(/\${rolesChannel}/g, rolesChannel);
	console.log('Welcome message ready.')
	
		//Add reactions to role message
		// Not done yet
});


//Greeting new members
client.on('guildMemberAdd', member => {
	if (!welcomechannel) return;
	welcomechannel.send(greeting);
	console.log('Greeted new member $(member)');
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
		let reply = `You didn't provide any arguments, ${message.author}!`;

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

//Reaction roles
Client.on('messageReactionAdd', (reaction, user) => {
	//check if reaction is by a bot
	//if message id == rolesmessage {
	//	message.reaction == 
	// 	if reaction.emoji.name == roles
	// 		member.roles.add(roles);
	//	Next entry
	// }

});
	


client.login('token');