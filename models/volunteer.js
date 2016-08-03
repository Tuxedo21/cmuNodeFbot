const Deployment = require('./deployment')
const Task = require('./task')

const Volunteer = bookshelf.Model.extend({
	tableName: 'volunteers',
	// fbid
	// name
	// weight
	// currentTask
	// deployment
	currentTask: function() {
		return this.hasOne(Task)
	},
	deployment: function() {
		return this.belongsTo(Deployment)
	},
	assignTask: function(task) {
		task.assignedVolunteer = this
  		this.currentTask = task
  		bot.sendMessage(ids.carlId, {text: "Vol id: ${vol.id} task: ${JSON.stringify(t)}"})
  		bot.sendMessage(this.id, {text: "Your task should take ${t.time} minutes."})
  		handlers.sendInstructions(this.currentTask.type, this)
	},
	sendMessage: function(message) {
		bot.sendMessage(this.fbid, message)
	}
})

module.exports = Volunteer