const {botId} = require ('../config/localConfig.json')
module.exports = (user) => {
    return user.id === botId
};