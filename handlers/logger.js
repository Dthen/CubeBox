const loggerOn = require('../config/config.json');
const {logChannelID, logToConsole, logToFile, logToChannel, logToAdmins} = require('../config/logger.json');
const getChannelById = require('./getChannelById');
const adminRoleId = require('../config/moderation.json')
const fs = require('fs');
let guild;
const log = (error) => {
    if (loggerOn) {
        let timestamp = new Date().toUTCString();
        if (!error) {
            if (logToConsole) loglog(timestamp + ': ' + error);
            if (logToFile) fs.appendFileSync('log.txt', timestamp + ': ' + error);
            if (logToChannel) getChannelById(guild, logChannelID).reply(timestamp + ': ' + error);
            if (logToAdmins) guild.roles.cache.fetch(adminRoleId).send(timestamp + ': ' + error);        

        }
    }
}

const setGuild = (clientGuild) => {
guild = clientGuild;
}

module.exports = {
    log,
    setGuild
}