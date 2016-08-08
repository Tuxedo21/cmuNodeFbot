const Deployment = require('./models/deployment.js').get()
const volunteers = require('./volunteers.js')
const constants = require('./constants.js')

/* Ask if Casual,   */
function roundRobin() {
	if (Deployment.isCasual) {
		oneRound()
	}
}

function oneRound() {
  volunteers.getAll().forEach((vol) => {
    if (!vol.currentTask) {
      volunteers.assignTask(vol, tasks.pop())
      vol.sendMessage({text: "Will you do this? Write 's' if yes and to start, 'r' if no"})
    }
  })
}

setInterval(roundRobin, Deployment.roundRobinTime * constants.MS_IN_MIN);
