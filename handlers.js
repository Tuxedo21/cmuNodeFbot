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

const aliases = {
	'd': 'done',
	'r': 'reject',
	's': 'start',
	'a': 'ask',
	'h': 'help',
	'hi': 'hello',
	'hey': 'hello',
}

function findVolunteer(payload, reply, callback) {
  Volunteer.where({fbid: payload.sender.id}).fetch({withRelated: ['deployment', 'currentTask']}).then((vol) => {
    if (!vol) {
      onBoardVolunteer(payload, reply)
    } else {
      callback(vol)
    }
  })
}

module.exports.dispatchMessage = (payload, reply) => {
  findVolunteer(payload, reply, function(vol) {
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

const postbackHandlers = {
  'JOIN_DEPLOYMENT': {
    handler: joinDeployment,
    volRequired: false,
  },
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
    findVolunteer(payload, reply, (vol) => {
      payload.sender.volunteer = vol
      found.handler(payload, reply)
    })
  } else {
    found.handler(payload, reply)
  }
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
  Volunteer.where({fbid: payload.sender.id}).fetch().then((vol) => {
    if (vol) {
      
      reply({text: `You are already in a deployment (${deployment.name}). You must leave that first.`})
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
  const deployment = vol.related('deployment')
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
}

function rejectMessage(payload, reply) {
  const vol = payload.sender.volunteer
  const deployment = vol.related('deployment')
  if (!deployment.isCasual) {
    reply({text: 'Sorry, you can\'t reject a task in this deployment.'})
    return
  }
  if (!vol.get('currentTask')) {
    reply({text: 'You don\'t have a task.'})
    return
  }
  vol.rejectTask().then(() => reply({text: "Task rejected."}))
}

function doneMessage(payload, reply) {
  const vol = payload.sender.volunteer
  const task = vol.related('currentTask')
  if (!task || !task.get('startTime')) {
    reply({text: "You don't have an active task."})
    return
  }

  const deployment = vol.related('deployment')
  // TODO (cgleason): double check this math works with ms conversion
  const xi =  task.estimatedTimeSec / task.elapsedTime
  let bestWeight = deployment.get('bestweight')
  if (xi > bestWeight) {
    bestWeight = xi
  }
            
  // Dragans Cool Math
  const nVol = deployment.related('volunteers').count()
  const avgWeight = ((deployment.get('avgweight')*(nVol - 1))/nVol) - xi/nVol
  const currWeight = (xi - (avgWeight/2)) / (bestWeight - (avgWeight/2));
  const newWeight = ((vol.get('weight'))*(1 - deployment.get('weightmultiplier'))) + currWeight*deployment.get('weightmultiplier');
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
  Promise.all(updates)
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
}

function helpMessage(payload  , reply) {
  const vol = payload.sender.volunteer
  vol.related('deployment').sendMentor(vol)
}

function greetingMessage(message, reply) {
	reply({text: "Hi!"})
}

function startEvent(message, reply, args) {
	// TODO(cgleason): instead of doing this, this should create new deployment
  	tasks.clear()
  	volunteers.clear()
  	Deployment.isCasual = false
    fs.readFile("botData.json", function(dataContent) {
    	let jsonContent = JSON.parse(dataContent)
    	fs.readFile("tasks.json", function(taskContent) {
    		const jsonTaskContent = JSON.parse(taskContent)
    		jsonContent.workPool = jsonTaskContent.tasks.length
        	jsonContent.volunteers = numVols
        	fs.writeFileSync("botData.json", JSON.stringify(jsonContent))
        	reply({text: "Volunteers: " + jsonContent.volunteers + "\nTasks: " + jsonContent.workPool})
        	const numVols = parseInt(values[1], 10)
        	const startWeight = 1 / numVols; // Weight/volunteers
        	for (var i = 0; i < numVols; i++) {
          		volunteers.new(ids.idArray[i].toString(), startWeight);//Volunteers Ids
        	}
        tasks.loadJSON("tasks.json", (taskArray) => {
          distributeTasks();
          setThreasholds(startWeight);
          //bot.sendMessage(ids.carlId, {text: globalWarThreashold + ":" + globalAskThreashold + ":" + globalSendThreashold });
        })
    })
})
}

function startCasual(message, reply, args) {
	// TODO(cgleason): instead of doing this, this should create new deployment
  	tasks.clear()
  	volunteers.clear()
    Deployment.isCasual = true
    var contents = fs.readFileSync("botData.json");
    var jsonContent = JSON.parse(contents);
    var taskContent = fs.readFileSync("tasks.json");
    var jsonTaskContent = JSON.parse(taskContent);

    jsonContent.workPool = jsonTaskContent.tasks.length;
         jsonContent.volunteers = parseInt(values[1], 10);
         jsonContent.askTime = parseInt(values[2], 10);
         // time values are specified in minutes, so convert to ms
         Deployment.roundRobinTime = parseInt(values[2], 10) * constants.MS_IN_MIN;
         fs.writeFileSync("botData.json", JSON.stringify(jsonContent));
         //bot.sendMessage(recipientId, {text: "You have " + jsonContent.volunteers + " volunteers" + "\nTasks: " + jsonContent.workPool});

         var startWeight = 1 / Number(values[1]); // Weight/volunteers
         for (var i = 0; i < Number(values[1]); i++) {
           globalWeightArray.push(startWeight);//Volunteers weight
           globalStartTime[i] = 1 * constants.MS_IN_MIN; // start up times
           globalDoneTime[i] = 1 * constants.MS_IN_MIN; // start up times
           volunteers.push(ids.idArray[i].toString());//Volunteers Ids
           //bot.sendMessage(ids.idArray[i], {text: "Hello volunteer: " + (i +1) + "\nWeight: " + globalWeightArray[i] + "\nWe're doing a casual deployment. Over time you will be asked if you have time to do work..." });
         }
         tasks.loadJSON("tasks.json", (tasksArray) => {
          setTimeout(oneRound, 20 * 1000);
          globalCasStart = Date.now();
         });
}