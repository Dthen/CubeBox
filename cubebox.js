//Import native Node modules
const fs = require('fs');
const Discord = require('discord.js');

//Create the bot's Discord client
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'ROLE'] });

//import internal config values
const {commandPrefix, archivistOn, reactionRolesOn, commandHandlerOn, loggingOn} = require(`./config/config.json`);
const {rolesMessageId, roles, rolesChannelId} = require('./config/reactionRoles.json');
const {guildId, token} = require('./config/localConfig.json');
const archivist = require('./handlers/archivist');
const greeter = require ('./handlers/greeter.js');
const reactionRolesHandler = require('./handlers//reactionRolesHandler.js');
const logger = require('./handlers/logger.js');
//hello, this is a pointless change for the sake of testing 

//Declare constants for command handler
const cooldowns = new Discord.Collection();

//Import command Files for command handler
client.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);}

//Log in and get going
client.once('ready', () => {


	client.guilds.fetch(guildId)
	.then(guild => {
	  if (loggingOn) logger.setGuild(guild);
	  logger.log('Found Guild ID.')
	  if (!guild) {
		  logger.log('Error fetching guild ID, check config.json')
	  }
	  if (archivistOn) archivist.init(guild);
	});
  

		//React to the reaction message with each of the reactions which modify roles so that the button is always present for users.
		client.channels.fetch(rolesChannelId)
			.then (channel => channel.fetch())
			.then (channel => channel.messages.fetch(rolesMessageId))
			.then(messageCollection => {
				let message = messageCollection;
				if (messageCollection instanceof Discord.TextChannel) {
					message = messageCollection.first();
				}
				Object.keys(roles).forEach(role => {
					let existingReaction = message.reactions.cache.find( reaction => reaction.emoji.name === role)
					if (existingReaction && existingReaction.me) return;
					message.react(role)
				});
				logger.log('Reacting to roles message.')
			})
			.catch(logger.log);
});

//Greeting new members
client.on('guildMemberAdd', (member) => {
	const guild = client.guilds.cache.fetch(guildId);
	if (greeterOn) greeter(guild, member)});

//Command controller (I haven't really changed this from the example yet)
client.on('message', message => {
	// Handle message event in archivist package
	if (archivistOn) archivist.handleMessage(message);

	// Continue to process command
	if (commandHandlerOn) {
		if (!message.content.startsWith(commandPrefix) || message.author.bot) return;

		const args = message.content.slice(commandPrefix.length).trim().split(/ +/);
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
				reply += `\nTry it like this: \`${commandPrefix}${command.name} ${command.usage}\``;
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
			logger.log(error);
			message.reply('Error: Cubic error - dimensions not equal to 3.');
		}
	}});

client.on('channelCreate', (channel) => {
	if (archivistOn) archivist.handleChannelCreate(channel);
});

client.on('channelDelete', (channel) => {
	if (archivistOn) archivist.handleChannelDelete(channel);
});

client.on('channelUpdate', (channel) => {
	if (archivistOn) archivist.handleChannelUpdate(channel);
});

/*
Regarding reactions. Currently these events are only used for roles, but later, when we implement polling, event management,
twitch integration, etc., we may need a sane way of working out which we want. There is also a way to wait for reactions on
specific messages as well, though, so this may be a non-issue.
*/


//Adding reaction roles

client.on('messageReactionAdd', (messageReaction, user) => {
	if (reactionRolesOn){
		try {
			const { emojiMember, emojiRole, emojiRoleName } = reactionRolesHandler(messageReaction, user);
			//Add the role and inform the user
			emojiMember.roles.add(emojiRole);
			user.send(`You are now one of the ${emojiRoleName}.`);}
			catch (error) {
				try {
						if (error=='noPermissions') user.send(`I\'m not allowed to change your role.`);
						logger.log('Error: bot lacks the "manage roles" permission, or the role giving it permission is below the role it is trying to change.');
							return;
				}
				catch (othererror){
					logger.log('Unknown error adding reaction roles rections. Please check yiour configs');
				}
		}
	}
});
//Removing reaction roles

client.on('messageReactionRemove', (messageReaction, user) => {
	if (reactionRolesOn){
	try {
		const { emojiMember, emojiRole, emojiRoleName } = reactionRolesHandler(messageReaction, user);
		//Remove the role and inform the user
		emojiMember.roles.remove(emojiRole);
		user.send(`You are no longer one of the ${emojiRoleName}.`);
	}
	catch (error) {
		if (error=='noPermissions') user.send('I\'m not allowed to change your role.');
	}
}});


/*Twitch Integration works by checking the status of  all the members whenever one changes,
this is done to see whose Dicord Status says they are streaming.
 If they are they are given the "Live" role.
 Checking status updates of all members whenever one changes is also used to determine
 whether or not a stream has gone offline. This is done so the "Live" can be removed.
*/
//Twitch Integration
/*
client.on("presenceUpdate", (oldPresence, newPresence) => {
	log`PresenceUpdate event fired.`)

	///On a new status update, check whether it's an activity before we check it's a stream and if not, do nothing
    if (
		!newPresence.activities ||
		!(oldPresence && oldPresence.activities)
	  ) return;
	  
	   //On a new status update, check whether they were previously streaming and if so, remove the "live" role.
	if (oldPresence.activities){
		//Check they were streaming, if so, remove the "Live" role
		oldPresence.activities.forEach(activity => {
			if (activity.type == "STREAMING") oldPresence.user.roles.remove(liveRoleId);
		});
	}

	///On a new status update, check whether it's an activity before we check it's a stream and if not, do nothing
	if (!newPresence.activities){
		log'noNewPresence');
		return;
	}
	newPresence.activities.forEach(activity => {
		if (activity.type == "STREAMING") newPresence.user.roles.add(liveRoleId);
	});
});
*/

//Log in to Discord
client.login(token);
