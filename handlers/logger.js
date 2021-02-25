const loggerOn = require('./config/config.json');
const {logChannelID, logToConsole, logToFile, logToChannel, logToAdmins} = require('./config/logger.json');
const getChannelById = require('./getChannelById');
const adminRoleId = require('./config/moderation.json')

module.exports = (guild, error) => {
    if (loggerOn) {
        let timestamp = new Date().toUTCString();
        if (logToConsole) log(timestamp + ': ' + error);
        if (logToFile) fs.appendFileSync('log.txt', timestamp + ': ' + error);
        if (logToChannel) getChannelById(guild, logChannelID).reply(timestamp + ': ' + error);
        if (logToAdmins) guild.roles.cache.fetch(adminRoleId).send(timestamp + ': ' + error);        
        }
    }
