const Discord = require (`discord.js`)
module.exports = {
	name: 'teams',
	description: `Splits the users in the current voice channel into teams`,
	cooldown: 5,
	execute(message, args) {
        //If no team number is specificed (no arguments, assumes 2 teams)
        let teams = 2
        if (args.length >= 1) teams = args[0]
        
        // Create a list of players in voice channel, ignoring deafened users and bots,
        // then shuffle that list
        const players = (message.member.voice.channel.members
            .filter(member => !member.voice.selfDeaf && !member.user.bot))
            .sort(() => Math.random() - 0.5)
            
        //Divide the players into teams  
        let playersByTeams = []
        while (playersByTeams.length < teams)
        {
            playersByTeams.push([])
        } 

        players.forEach((player, index) => {
            playersByTeams[index % playersByTeams.length].push(player)
        } )

        const embed = new Discord.MessageEmbed()
        .setTitle (`Here is your list of teams:`)
        .setColor(0x553E90)
        .addFields(
            ...playersByTeams.map((players, index) => {
                return {
                    name: `Team ${index + 1}`,
                    value: players.join('\n'),
                    inline: true,
                };
            })
        )
    // reply wih list of users in the same voice channel divided into teams.
    message.channel.send(embed)
    log(message.channel.author.name + ' asked for their channel to be split into ' + teams` teams.`);

	},
};
