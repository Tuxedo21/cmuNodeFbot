const Deployment = require('./models/deployment.js')
const Volunteer = require('./models/volunteer.js')
const constants = require('./constants.js')

const messageHandlers = {
	'hello': {
		handler: greetingMessage,
	},
	'kitten': {
		handler: kittenMessage,
	},
	'done': {
		handler: doneMessage,
	},
	'start': {
		handler: startMessage,
	},
	'ask': {
		handler: askMessage,
	},
	'reject': {
		handler: rejectMessage,
	},
	'help': {
		handler: helpMessage,
	},
}

const postbackHandlers = {
  'JOIN_DEPLOYMENT': {
    handler: joinDeployment,
    volRequired: false,
  },
}

const aliases = {
	'd': 'done',
	'r': 'reject',
	's': 'start',
	'a': 'ask',
	'h': 'help',
	'hi': 'hello',
	'hey': 'hello',
}

module.exports.dispatchMessage = (payload, reply) => {
  Volunteer.where({fbid: payload.sender.id}).fetch()
  .then((vol) => {
    if (!vol) {
      onBoardVolunteer(payload, reply)
      return
    }
    payload.sender.volunteer = vol
    const values = payload.message.text.toLowerCase().split(' ')
    let command = values[0]
    if (command in aliases)
      command = aliases[command]

    if (command in messageHandlers) {
      const commandHandler = messageHandlers[command]
      if (values.length-1 != (commandHandler.requiredArgs || 0)) {
        reply({text: `The ${command} command requires ${commandHandler.requiredArgs} arguments.`})
      } else {
        commandHandler.handler(payload, reply, values.slice(1));
      }
    } else {
      reply({text: `Command ${command} not found. Try one of the following: ${Object.keys(messageHandlers)}.`})
    }
  })
}

module.exports.dispatchPostback = (payload, reply) => {
  const strs = Object.keys(postbackHandlers)
  let result = null
  for (let i = 0; i < strs.length; i++) {
    if (payload.postback.startsWith(strs[i])) {
      result = strs[i]
      break
    }
  }
  if (!result) throw new Error(`invalid postback: ${payload.postback}`)
  const found = postbackHandlers[result]
  if (found.volRequired) {
    Volunteer.where({fbid: payload.sender.id}).fetch()
    .then(() => {
      payload.sender.volunteer = vol
      found.handler(payload, reply)
    })
  } else {
    found.handler(payload, reply)
  }
}

function greetingMessage(message, reply) {
  reply({text: "Hi!"})
}

function helpMessage(payload  , reply) {
  const vol = payload.sender.volunteer
  vol.related('deployment').fetch().then(d => d.sendMentor(vol))
}
 
function onBoardVolunteer(payload, reply) {
  Deployment.fetchAll().then(function(deployments) {
    if (deployments.count() == 0) {
      reply({text: `Hi! ${payload.sender.profile.first_name}, I am the luzDeploy bot. 
        We don't have any deployments right now, so please check back later!`})
    } else {
      const response = {
          "attachment":{
            "type":"template",
            "payload":{
              "template_type": "button",
              "text": `Hi! ${payload.sender.profile.first_name}, I am the luzDeploy bot. Which deployment would you like to join?`,
              "buttons": deployments.map((d) => ({type:"postback", title: d.get('name'), payload: `JOIN_DEPLOYMENT_${d.get('id')}`}))
            }
          }
      }
      reply(response)
    }
  })
}

function joinDeployment(payload, reply) {
  Volunteer.where({fbid: payload.sender.id}).fetch({withRelated: ['deployment']}).then((vol) => {
    if (vol && vol.related('deployment')) {
      reply({text: `You are already in a deployment (${vol.related('deployment').get('name')}). You must leave that first.`})
    } else {
      const deployId = parseInt(payload.postback.substr('JOIN_DEPLOYMENT_'.length), 10)
      Deployment.where({id: deployId}).fetch().then((deployment) => {
        if (!deployment) throw new Error(`invalid deployment id: ${deployId}`)
        let method = {method: 'insert'}
        if (vol)
          method = {method: 'update'}
        new Volunteer().save({
          fbid: payload.sender.id,
          deployment_id: deployment.get('id'),
          first_name: payload.sender.profile.first_name,
          last_name: payload.sender.profile.last_name
        }, method).then(function(vol) {
          reply({text: `Great! Welcome to the ${deployment.get('name')} deployment!`})
        })
      })
    }
  })
}

function kittenMessage(payload, reply) {
    reply({
        "attachment": {
            "type": "image",
            "payload": {
                "url": "http://thecatapi.com/api/images/get?format=src&type=png&size=med"
            },
        }
    })
}

function startMessage(payload, reply) {
  const vol = payload.sender.volunteer
	vol.related('currentTask').fetch().then((task) => {
    if (!task) {
      reply({text: 'You don\'t have a task!'})
      return
    } else if (task.get('startTime')) {
      reply({text: 'This task has already been started!'})
      return
    } else {
      task.start().then((model) => {
        reply({text: `Task started at ${task.get('startTime')}.`})
      })
    }
  })
}

function askMessage(payload, reply) {
  // Get a task in the pool, and ask if he wants to do it.
  const vol = payload.sender.volunteer
  vol.related('deployment').fetch().then(deployment => {
  if (!deployment.isCasual) {
    reply({text: 'Sorry, you can\'t ask for a task in this deployment.'})
    return
  }
  if (vol.get('currentTask')) {
    reply({text: 'You already have a task! Finish that first.'})
    return
  }
  vol.related('deployment').getTaskPool().then(pool => {
    if (pool.length > 0) {
      vol.assignTask(pool.pop())
    } else {
      reply({text: 'There are no tasks available right now.'})
    }
  })
})
}

function rejectMessage(payload, reply) {
  const vol = payload.sender.volunteer
  vol.related('deployment').fetch().then(deployment => {
    if (!deployment.isCasual) {
      reply({text: 'Sorry, you can\'t reject a task in this deployment.'})
      return
    }
    if (!vol.get('currentTask')) {
      reply({text: 'You don\'t have a task.'})
      return
    }
    vol.rejectTask().then(() => reply({text: "Task rejected."}))
  })
}

function doneMessage(payload, reply) {
  const vol = payload.sender.volunteer
  vol.load(['deployment', 'currentTask']).then(vol => {
    const task = vol.related('currentTask')
    if (!task || !task.get('startTime')) {
      reply({text: "You don't have an active task."})
      return
    }

    const deployment = vol.related('deployment')
    // TODO (cgleason): double check this math works with ms conversion
    const xi =  task.estimatedTimeSec / task.elapsedTime
    let bestWeight = deployment.get('bestWeight')
    if (xi > bestWeight) {
      bestWeight = xi
    }
            
    // Dragans Cool Math
    const nVol = deployment.related('volunteers').count()
    const avgWeight = ((deployment.get('avgWeight')*(nVol - 1))/nVol) - xi/nVol
    const currWeight = (xi - (avgWeight/2)) / (bestWeight - (avgWeight/2));
    const newWeight = ((vol.get('weight'))*(1 - deployment.get('weightMultiplier'))) + currWeight*deployment.get('weightMultiplier');
    const subtract = (newWeight - vol.get('weight'))/(nVol - 1);
            
    //UPDATE WEIGHTS!
    const updates = deployment.related('volunteers').map((v) => {
      if (v.id != vol.id)
        return v.save({weight: v.get('weight') - subtract}, {patch: true})
      else
          return v.save({weight: newWeight, currentTask: null}, {patch: true})
    })
    updates.push(deployment.save({bestweight: bestWeight, avgweight: avgWeight}, {patch: true}))
    updates.push(task.finish())
    return Promise.all(updates)
    .then(deployment.checkThresholds)
    .then(deployment.getTaskPool).then((pool) => {
      reply({text: `Thanks! You ended at ${task.get('doneTime')}.`})
      if (pool.length > 0) {
        if (deployment.isCasual) {
          vol.assignTask(pool.pop())
        } else {
          reply({text: "You don't have any more tasks, but there are still some left for others."});
        }
      } else {
        deployment.finish()
      }
  })
  })
}