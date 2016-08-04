const Bot = require('messenger-bot')

const cli = require('./cli')
const handlers = require('./handlers')

let bot = null
if (cli.interactive) {
  bot = require('./interactive')
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
      payload.message.sender.profile = profile
      handlers.disptachMessage(payload, reply)  
    })
  })

  bot.on('postback', handlers.disptachPostback)
}

module.exports = bot