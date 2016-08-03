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

  bot.on('message', handlers.disptach)
  bot.on('postback', (payload, reply) => {
    console.log("Postback received: " + JSON.stringify(payload.postback))
  })
}





exports = bot