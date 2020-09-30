const { stations } = require('../radio.json');
module.exports = {
	name: 'radio',
	description: 'Plays rado stations.',
	args: true,
	execute(message, args) {
        const stationUrl = stations[args[0].toLowerCase()] ;

        if (args[0].toLowerCase() == 'on') {
            //if argument is 'on', pick a random radio station and play it
            message.reply('Playing a random radio station:') 
            }
        
        else if (args[0].toLowerCase() == 'off') {
            //if the first argument is 'off',//stop playing
            //change this to if the bot is in a voice channel, this currenlty only works if the user is in the same voice channel
            if (message.member.voice.channel) {

                const connection = message.member.voice.channel.join()
                .then(connection => {
                    connection.disconnect();
                    message.reply('Turning off the radio.')
                });  
            }
            //if the bot is playing nothing, say so and do nothing
        } 
        else if (args[0].toLowerCase() == 'stations') {
            //if  argument is 'stations', print list of radio stations
            message.reply('Here is a list of all available stations:');
        }
        else if (stationUrl) {
            //play that station
            if (message.member.voice.channel) {
                const connection = message.member.voice.channel.join()
                    .then(connection => {
                        const dispatcher = connection.play(stationUrl);
                        message.reply('Playing radio station: ' + args[0]);
                    });
              } else {
                return (message.reply('You need to join a voice channel first!'));
              }

        }
        else {
            message.reply('Unknown radio station');
        }
    }

}
