const bookshelf = require('../bookshelf')
const bot = require('../bot')
const handlers = require('../handlers')

require('./deployment')
require('./task')
require('./base-model')
const Volunteer = bookshelf.model('BaseModel').extend({
	tableName: 'volunteers',
	idAttribute: 'fbid',
	// fbid
	// name
	// weight
	// currentTask
	// deployment
	currentTask: function() {
		return this.belongsTo('Task', 'current_task')
	},
	deployment: function() {
		return this.belongsTo('Deployment')
	},
	assignTask: function(task) {
  		return Promise.all([
  			this.save({currentTask: task.id}, {patch: true}),
  			task.save({volunteer_fbid: this.id}, {patch: true})
  		])
  		.then(() => {
  			//bot.sendMessage(ids.carlId, {text: "Vol id: ${vol.id} task: ${JSON.stringify(t)}"})
  			this.sendMessage({text: `Your task should take ${task.estimatedTimeMin} minutes.`})
        	const instructions = task.get('instructions')
        	let currWait = 0
	       	const msgFn = this.sendMessage.bind(this)
        	instructions.forEach((i) => {
          		currWait = currWait + i.wait
          		setTimeout(msgFn, currWait*1000, i.message)
        	})
        	setTimeout(msgFn, (currWait+1)*1000, {text: "Once you understood the steps please write 's' when you start and then 'd' when you are done. You can also write 'r' if you want to not do the task before you have written 'd'. "})
      	})
	},
	rejectTask: function() {
		console.log(this)
		console.log(this.related('currentTask'))
		return this.related('currentTask').fetch()
		.then((task) => {
			return Promise.all([
				this.save({currentTask: null}),
				task.save({volunteer_fbid: null, startTime: null}, {patch: true})
			])
		})
	},
	sendMessage: function(message) {
		bot.sendMessage(this.get('fbid'), message)
	},
	virtuals: {
		name: function() {
			return `this.get('firstName') this.get('lastName')`
		}
	}
})

module.exports = bookshelf.model('Volunteer', Volunteer)