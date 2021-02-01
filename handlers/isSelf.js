const {botId} = require ('../config/config.json')
module.exports = (user) => {
    return user.id === botId
};