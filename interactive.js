const readline = require('readline')

const handlers = require('./handlers')

let instance = null

class Interactive {
	constructor() {
		if (!instance) {
			instance = this
		}
    this.currentVolunteer = 1
		this.interface = readline.createInterface({
			input: process.stdin,
    	output: process.stdout,
  	})
    this.setPrompt()

		return instance
	}

	sendMessage(id, message) {
    	this.interface.write(`(${id}) < ${message}`)
  }

  setPrompt() {
    this.interface.setPrompt(`(${this.currentVolunteer}) > `)
  }
  	
  startListening() {
  	this.interface.on('line', (line) => {
  		const values = line.trim().split(' ')
  		if (values.length == 2 && values[0] == '/vol') {
  			this.currentVolunteer = parseInt(values[1], 10)
        this.setPrompt()
  		} else {
        const reply = this.sendMessage.bind(this, this.currentVolunteer)
        const payload = {
          message: {text: line.trim()}
        }
        handlers.dispatch(payload, reply)
      }
		  this.interface.prompt()
	}).on('close', () => {
 			console.log('Bot shutdown.');
 			process.exit(0);
	})
  this.interface.prompt()
 	}
}

module.exports = new Interactive()

