const readline = require('readline')

let instance = null

class Interactive{
	constructor() {
		if (!instance) {
			instance = this
		}
		this.interface = readline.createInterface({
			input: process.stdin,
    		output: process.stdout
  		})
  		this.currentVolunteer = 1

		return instance
	}

	sendMessage(id, message) {
    	this.interface.write("(${id}) < ${message}")
  	}
  	
  	startListening() {
  		this.interface.on('line', (line) => {
  			const values = line.trim().split(' ')
  			if (values.length == 2 && values[0] == '/vol') {
  				this.currentVolunteer = parseInt(values[1], 10)
  				this.interface.setPrompt('(${this.currentVolunteer}) > ')
  			}

  			const reply = this.sendMessage.bind(this, this.currentVolunteer)
  			const payload = {
  				message: {text: line.trim()}
  			}
  			handlers.dispatch(message, reply)
			rl.prompt()
		}).on('close', () => {
  			console.log('Bot shutdown.');
  			process.exit(0);
		})
  	}
}

exports = new Interactive()

