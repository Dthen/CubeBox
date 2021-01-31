const {botId} = require ('../config.json')
module.exports = (user) => {
    return user.id === botId
};