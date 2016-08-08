const Bot = require('messenger-bot')

const cli = require('./cli')
const handlers = require('./handlers')

if (cli.interactive) {
  let bot = require('./interactive').instance
  module.exports.sendMessage = bot.sendMessage.bind(bot)
  module.exports.startListening = bot.startListening.bind(bot)
} else {
  let bot = new Bot({
    token: process.env.PAGE_ACCESS_TOKEN,
    verify: 'testbot_verify_token',
    app_secret: process.env.APP_SECRET,
  })

  bot.on('error', (err) => {
    console.log(err.message)
  })

  bot.on('message', (payload, reply) => {
    bot.getProfile(payload.sender.id, (err, profile) => {
      if (err) throw err
      payload.sender.profile = profile
      handlers.disptachMessage(payload, reply)  
    })
  })

  bot.on('postback', handlers.disptachPostback)

  module.exports.sendMessage = bot.sendMessage.bind(bot)
  module.exports.startListening = bot.startListening.bind(bot)
}