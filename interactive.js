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
    this.buttons = []

		return instance
	}

	sendMessage(id, message) {
    let text = message.text
    if (!text && message.attachment && message.attachment.payload) {
      text = message.attachment.payload.text
      if (message.attachment.payload.template_type == "button") {
        const buttons = message.attachment.payload.buttons
        let i = this.buttons.length
        buttons.forEach((b) => text = text + `\n\t${i++}. ${b.title}`)
        this.buttons.push(...buttons)
        text = text + "\n\tYou can choose a button with the command '/but <button number>'."
      }
    }
    console.log(`to: (${id}) < ${text}`)
    this.interface.prompt()
  }

  setPrompt() {
    this.interface.setPrompt(`(${this.currentVolunteer}) > `)
  }
  	
  startListening() {
  	this.interface.on('line', (line) => {
  		const values = line.trim().split(' ')
      const reply = this.sendMessage.bind(this, this.currentVolunteer)
  		if (values.length == 2 && values[0] == '/vol') {
  			this.currentVolunteer = parseInt(values[1], 10)
        this.setPrompt()
      } else if (values.length == 2 && values[0] == '/but') {
        const buttonIndex = parseInt(values[1], 10)
        if (buttonIndex < this.buttons.length) {
          const payload = {postback: this.buttons[buttonIndex].payload}
          handlers.dispatchPostback(payload, reply)
        }
  		} else {
        const payload = {
          message: {
            sender: {
              id: this.currentVolunteer,
              profile: {
                first_name: "John",
                last_name: "Smith"
              }
            },
            text: line.trim()
          }
        }
        handlers.dispatchMessage(payload, reply)
      }
	}).on('close', () => {
 			console.log('Bot shutdown.');
 			process.exit(0);
	})
  this.interface.prompt()
 	}
}

module.exports = new Interactive()

