	
module.exports = () => {
    //Only respond to reactions on the correct message
	if (messageReaction.message.id != rolesMessage)	throw(noRolesMessage);

	//Check client has permission to manage roles
	if (!messageReaction.message.guild.me.hasPermission('MANAGE_ROLES')) return user.send('I\'m not allowed to change your role.');

	// Fetch GuildMember from User	
	const emojiUser = messageReaction.message.guild.members.cache.find(member => member.id === user.id);

	//Check the user adding the reaction is not the bot so the bot doesn't change its own roles.
	if (emojiUser.id === id) throw(ownEmoji);

	//Get role's name from used emoji
	const emojiRoleName = roles[messageReaction.emoji.name];

	//Get role's ID from name
	const emojiRole = messageReaction.message.guild.roles.cache.find(r => r.name === emojiRoleName);

	//Don't try to change roles which don't exist
    if (!emojiRole) return;
    return {emojiRole, emojiUser};
}