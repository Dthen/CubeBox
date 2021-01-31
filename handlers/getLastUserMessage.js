const isSelf = require ('./isSelf.js');

/** @typedef {import('discord.js').Message} Message */
/** @typedef {import('discord.js').TextChannel} TextChannel */

/**
 * @param {TextChannel} channel
 * @param {{ limit: number, before?: number }} options
 */
const fetchLastUserMessage = (channel, options) => 
    channel.messages.fetch(options)
  
        .then(messages => {
            const lastMessage = messages.first();
            if (!lastMessage){
                return ('noUserMessage')
            }
        
            const userMessage = messages.find(message => !isSelf(message));

            if (userMessage) {
                return userMessage
            }


            return fetchLastUserMessage(channel, {
                ...options,
                before: lastMessage.id
            })
        })
        
/**
 * @param {TextChannel} channel
 * @returns {Promise<Message>}
 */
module.exports = (channel) => {
    const { lastMessage } = channel;
    if (!isSelf(lastMessage)) {
        return Promise.resolve(lastMessage);
    }

    return fetchLastUserMessage(channel, { limit: 3 });

}


