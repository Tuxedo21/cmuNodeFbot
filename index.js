const async = require('async')
const fs = require("fs")
const http = require('http')

const cli= require('./cli')
const bot = require('./bot')

if (!cli.interactive) {
	const port = process.env.PORT || 3000
	http.createServer(bot.middleware()).listen(port, () => {
  		console.log('Echo bot server running at port ${port}.')
	})
} else {
	bot.startListening()
}


