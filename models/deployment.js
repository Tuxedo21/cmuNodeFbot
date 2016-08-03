const bookshelf = require('../bookshelf')

const Deployment = bookshelf.Model.extend({
	//averageWeight: 1,
	//bestWeight: 0,
	//warnThreshold: 1/2, // TODO (cgleason): fix these thresholds
	//askThreshold: 1/3,
	//sendThreshold: 1/4,
	//roundRobinInterval: 1 * constants.MS_IN_MIN,
	//type:'event', // casual, semi-casual, event
	//lat: null,
	//long: null,
	//weightMultiplier
	tableName: 'deployments',
	volunteers: function() {
		this.hasMany('Volunteer')
	},
	tasks: function() {
		this.hasMany('Task')
	},
	distributeTasks: function() {
		const workPool = this.related('tasks').filter((t) => !t.assignedVolunteer)

		this.related('volunteers')
			.filter((v) => !v.currentTask)
			.forEach((v) => {
    			if (workPool.length > 0) {
     				v.assignTask(tasks.pop())
    			}
			})
	},
	sendMentor: function(mentee) {
		let vols = this.related('volunteers').splice(0)
		const i = vols.find(mentee)
		vols.splice(i, 1)
		const mentor = vols.reduce((prev, current) => {
			return (prev.weight > current.weight) ? prev : current
		})
  		// send message to mentee
  		mentee.sendMessage({text: "We are sending a mentor to you"})
  		// send message to mentor
  		mentor.sendMessage({text: "Go help volunteer number ${mentee.name}"})
	},
	virtuals: {
		startWeight: function() {
			return 1 / this.related('volunteers').count()
		},
	}
})

exports = Deployment