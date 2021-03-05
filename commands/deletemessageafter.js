const multipliers = {
        second: 1,
        seconds: 1,
        minute: 60,
        minutes: 60,
        hour: 60 * 60,
        hours: 60 * 60,
        day: 24 * 60 * 60,
        days: 24 * 60 * 60,
        night: 24 * 60 * 60,
        week: 7 * 24 * 60 * 60,
        weeks: 7 * 24 * 60 * 60,
        month: 4 * 7 * 24 * 60 * 60,
        months: 4 * 7 * 24 * 60 * 60
    };    

module.exports = {
	name: 'deleteafter',
	description: 'Deletes your message after a specified amount of time.',
	usage: `Use the delete command followed by the amount of time you want the bot to delete your message after and it will automatically delete your message after that amount of time. Defaults to  minutes and has a maximum of 3 days. If you don't provide any arguments it will default to five minutes. It won't undestand something like \`!deleteafter 1 hour and a half\`, though, you would have to write \`deleteafter 1.5 hours\` Here are some examples: \n
    \`deletafter 30 seconds\` \n 
    \`!deleatafter 2 minute\` \n
     \`deleteafter 5 hours\` \n
     \`deleteafter 1 day\``,
     args: true,
     aliases: ['da', 'timeddelete', 'td', 'delete'],
	cooldown: 5,
	execute(message, args) {
        //Are the parameters valid?
        if (!isfinite(args[0]) || typeof((args[1])) !== string) return;
        //If there are none use the default.
        if (!args) timeToWait = (5*60);
        timeToWait = args[0]*(multipliers.names[args[1]]);
        setTimeout(() => { message.delete(); }, timeToWait);
	}
}