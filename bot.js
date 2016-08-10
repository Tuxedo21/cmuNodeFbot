const Bot = require('messenger-bot')
const http = require('http')

const cli = require('./cli')
const handlers = require('./handlers')

let bot = null
if (cli.interactive) {
  bot = require('./interactive').instance
  module.exports.sendMessage = bot.sendMessage.bind(bot)
} else {
  bot = new Bot({
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
  bot.on('postback', handlers.dispatchPostback)

  module.exports.sendMessage = bot.sendMessage.bind(bot)
  bot.startListening = function() {
    const port = process.env.PORT || 3000
    http.createServer(bot.middleware()).listen(port, () => {
        console.log(`Echo bot server running at port ${port}.`)
    })
  }
}

bot.startListening()