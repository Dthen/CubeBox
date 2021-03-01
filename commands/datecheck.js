module.exports = {
	name: '',
	description: 'Tells you when now is.',
	usage: '[command name]',
	cooldown: 5,
	execute(message) {
        let d = new Date().toUTCString();
        message.reply(d);	}
}
