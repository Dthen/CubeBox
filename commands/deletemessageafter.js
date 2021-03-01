const multipliers = [
        second = 1, seconds=1,
        minutes = 60*seconds,
        minutes = minute,
        hour = minutes*60,
        hours = hour,
        day = hours*24,
        day = days,
        night = day,
        week = day*7,
        weeks = week,
        month = weeks*4,
        months = month
];

module.exports = {
	name: 'deleteafter',
	description: 'Deletes your message after a specified amount of time.',
	usage: `Use the delete command followed by the amount of time you want the bot to delete your message after and it will automatically delete your message after that amount of time. Defaults to  minutes and has a maximum of 3 days. If you don't provide any arguments it will default to five minutes. It won't undestand something like \`!deleteafter 1 hour and a half\`, though, you would have to write \`deleteafter 1.5 hours\` Here are some examples: \n
    \`deletafter 30 seconds\` \n 
    \`!deleatafter 2 minute\` \n
     \`deleteafter 5 hours\` \n
     \`deleteafter 1 day```,
     args: [timeToWait, multiplier],
     aliases: ['da'],
	cooldown: 5,
	execute(message, args) {
        //Are the parameters valid?
        if (!isfinite(args[0]) || typeof((args[1])) !== string) return;
        //If there are none use the default.
        if (!args) timeToWait = (5*60);
        timeToWait = args(0)*multiplier;
        setTimeout(() => { message.delete(); }, timeToWait);
	}
}