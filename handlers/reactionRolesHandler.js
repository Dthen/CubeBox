const {rolesMessageId, roles,} = require('../config/config.json');
module.exports = (messageReaction, user) => {
	//Check the user adding the reaction is not this bot
	if (user.bot) return;

    //Only respond to reactions on the correct message
	if (messageReaction.message.id != rolesMessageId)	return;

	//Check client has permission to manage roles
    if (!messageReaction.message.guild.me.hasPermission('MANAGE_ROLES')) throw 'I am missing the "manage roles" permission';

	// Fetch GuildMember from User	
	const emojiMember = messageReaction.message.guild.members.cache.find(member => member.id === user.id);

	//Get role's name from used emoji
	const emojiRoleName = roles[messageReaction.emoji.name];

	//Get role by id
	const emojiRole = messageReaction.message.guild.roles.cache.find(r => r.id === emojiRoleId);

	//Don't try to change roles which don't exist
    if (!emojiRole) return;

    return {emojiRole, emojiMember, emojiRoleName};
}