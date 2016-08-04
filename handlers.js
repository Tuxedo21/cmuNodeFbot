const bot = require('./bot.js')
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
	'startwith': {
		handler: startEvent,
		requiredArgs: 1,
	},
	'startcas': {
		handler: startCasual,
		requiredArgs: 2,
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
  Volunteer.where({fbid: payload.message.sender.id}).fetch().then((vol) => {
    if (!vol) {
      onBoardVolunteer(payload.message, reply)
      return
    } else {
      payload.sender.volunteer = vol
      
      const values = payload.message.text.toLowerCase().split(' ')
      let command = values[0]
      if (command in aliases)
        command = aliases[command]

      if (command in messageHandlers) {
        const commandHandler = messageHandlers[command]
        if (values.length-1 != (commandHandler.requiredArgs || 0)) {
          reply({text: "The ${command} command requires ${commandHandler.requiredArgs} arguments."})
        } else {
          commandHandler.handler(payload.message, reply, values.slice(1));
        }
      } else {
        reply({text: "Command ${command} not found. Try one of the following: ${messageHandlers.keys()}."})
      }
    }
  })
}

module.exports.dispatchPostback = (payload, reply) => {
  console.log("Postback received: " + JSON.stringify(payload.postback))
}


function onBoardVolunteer(message, reply) {
  Deployment.fetchAll().then(function(deployments) {
    if (deployments.count() == 0) {
      reply({text: `Hi! ${message.sender.profile.first_name}, I am the luzDeploy bot. 
        We don't have any deployments right now, so please check back later!`})
    } else {
      const response = {
          "attachment":{
            "type":"template",
            "payload":{
              "template_type": "button",
              "text": `Hi! ${message.sender.profile.first_name}, I am the luzDeploy bot. Which deployment would you like to join?`,
              "buttons": deployments.map((d) => ({type:"postback", title: d.get('name'), payload: `JOIN_DEPLOYMENT_${d.get('deployid')}`}))
            }
          }
      }
      reply(response)
    }
  })
}

function kittenMessage(message, reply) {
    reply({
        "attachment": {
            "type": "image",
            "payload": {
                "url": "http://thecatapi.com/api/images/get?format=src&type=png&size=med"
            },
        }
    })
}

function startMessage(message, reply) {
	const vol = volunteers.find(message.sender.id)
	if (vol) {
		vol.currentTask.startTime= Date.now();
		// TODO(cgleason): move this reply into a "start task" function?
		reply({text: "Task started at ${vol.currentTask.started}."})
    }
}

function askMessage(message, reply) {
	// TOOD(cgleason): respond with error if not casual
    // Get a task in the pool, and ask if he wants to do it.
    if(tasks.count() > 0){
    	const vol = volunteers.find(message.sender.id)
    	assignTask(vol, tasks.pop())
    }
}

function rejectMessage(message, reply) {
	// TOOD(cgleason): respond with error if not casual
    const vol = volunteers.find(message.sender.id)
    vol.currentTask.assignedVolunteer = null
    tasks.add(vol.currentTask)
    vol.currentTask = null
    reply({text: "Task rejected."})
}

function doneMessage(message, reply, args) {
	let vol = volunteers.get(message.sender.id)
  	const task = vol.currentTask;
    if (!task || !task.startTime) {
    	reply({text: "You don't have an active task."})
        return
    }
   	task.completeTime = Date.now()
    reply({text: "Thanks! You ended at ${new Date(globalDoneTime[volIndex]}."})

    vol.currentTask = null

    // TODO (cgleason): double check this math works with ms conversion
    const xi =  task.time / (task.completeTime - task.startTime) //xi for weight
    if (xi > globalBest) {
        globalBest = xi
    }
            
    // Dragans Cool Math
    globalAvg = ((globalAvg*(volunteers.count() - 1))/volunteers.count()) - xi/volunteers.count();
    const curWeight = (xi - (globalAvg/2)) / (globalBest - (globalAvg/2));
    const newWeight = ((vol.weight)*(1 - globalMult)) + curWeight*globalMult;
    const subtract = (newWeight - vol.weight)/(volunteers.count() - 1);
            
    //UPDATE WEIGHTS!
    vol.weight = newWeight
    // mf subtract the weight of others
    volunteers.getAll().forEach((v) => {
        if (v != vol) {
           	v.weight = v.weight - subtract
            // check thresholds
            if (v.weight < Deployment.sendThreshold) {
    			sendMentor(v)
  			} else if (v.weight < Deployment.askThreshold) {
    			bot.sendMessage(v.id, {text: "Do you want help? If so do..."})
  			} else if (v.weight < Deployment.warnThreshold) {
    			bot.sendMessage(v.id, {text: "You are lagging behind"})
  			}
        }
    })
    // if there are more takss, assign one (not in casual mode)
    if (tasks.count() > 0) {
        if (!isCasual) {
        	assignTask(vol, tasks.pop())
        } else {
       		reply({text: "You don't have any more tasks, but there are still some left for others."});
        }
    } else {
    	// TODO(cgleason): what is logic for when the survey is sent?
    	// TODO(cgleason): make survey into a button
    	reply({text: "Thank you very much!\nYou just helped by giving light to the visually impaired.\n\nI am still in research phase, please answer this survey so I can become better at helping.\n\nhttps://docs.google.com/forms/d/1hcwB18hnyniWFUQAQDm2MSMdlQQL4QYOG_Md9eFsQnE/viewform"})
    }
}

function helpMessage(message, reply) {
    if(volunteers.count() > 1) {
   		sendMentor(message.sender.id);
   }
}

function greetingMessage(message, reply) {
	// TODO(cgleason): need to rewrite this message
	if (!vol) {
	} else {
		reply({text: "Hi!"})
	}
};

function fingerprintingMessage(vol) {
	setTimeout(bot.sendMessage, 2 * 1000, vol.id, {text: Data.texts().fingerprinting.fingerprinting1})
	setTimeout(bot.sendMessage, 2 * 1000, vol.id, {text: Data.texts().fingerprinting.fingerprinting2})
	const imageMesage = {
    	"attachment": {
      		"type": "image",
      		"payload": {
       			"url": Data.linkes().fingerprintingLinks.redImage,
			},
    	}
	}
  setTimeout(bot.sendMessage, 9 * 1000, vol.id, imageMessage)
}

function batteryMessage(vol) {
    const m = Data.texts().batteryMaintenance
    setTimeout(bot.sendMessage, 2 * 1000, vol.id, {text: m.batteryMaintenance1})
    setTimeout(bot.sendMessage, 2 * 1000, vol.id, {text: m.batteryMaintenance2})
    const lnks = Data.linkes().batteryManagementLinks
    const sideImageUrl = lnks.batterySides
    const explodeImageUrl = lnks.batteryExplode
    const nailImageUrl = lnks.batteryManagementLinks

    const imageMessage = {
        "attachment": {
        	"type": "template",
        	"payload": {
          		"template_type": "generic",
          		"elements": [{
          			"title": "How to open a beacon.",
            		"subtitle": "Please try this way. People tend to not read instructions.",
            		"item_url": nailImageUrl,
            		"image_url": nailImageUrl,
            		"buttons": [{
              			"type": "web_url",
              			"url": imageUrl.toString(),
              			"title": "Open Web URL"
            		}]
          		}, {
            		"title": "Battery sides",
            		"subtitle": "Here you can see how the battery should be placed.",
            		"item_url": sideImageUrl,
            		"image_url": sideImageUrl,
            		"buttons": [{
              			"type": "web_url",
              			"url": sideImageUrl,
              			"title": "Open Web URL"
            		}]
          		},{
            		"title": "Battery exploded",
            		"subtitle": "Here you can see all the parts of the beacon.",
            		"item_url": explodeImageUrl,
            		"image_url": explodeImageUrl,
            		"buttons": [{
              			"type": "web_url",
             			"url": explodeImageUrl,
              			"title": "Open Web URL"
            		}]
          		}]
        	}
      	}
    }
    setTimeout(bot.sendMessage, 9 * 1000, vol.id, imageMessage)
  }

function beaconMessage(vol) {
	const m = Data.texts().placingBeacons
  	setTimeout(bot.sendMessage, 2 * 1000, vol.id, {text: m.placingBeacons1 });
  	setTimeout(bot.sendMessage, 2 * 1000, vol.id, {text: m.placingBeacons2 });
  	const imageMessage = {
    	"attachment": {
      		"type": "template",
      		"payload": {
        		"template_type": "generic",
        		"elements": [{
          			"title": "Map",
          			"subtitle": "Here you can see your deployment map.",
          			"item_url":  Data.linkes().placingBeaconsLinks.blueImage,
         			"image_url":  Data.linkes().placingBeaconsLinks.blueImage,
          			"buttons": [{
            			"type": "web_url",
            			"url": blueImage,
            			"title": "Open Web URL"
          			}]
        		}]
      		}
    	}
    }
    setTimeout(bot.sendMessage, 9 * 1000, vol.id, imageMessage)
}

function sendInstructions(command, vol) {
	if (command === 'bm') {
    	batteryMessage(vol)
  	} else if (command === 'bd') {
    	beaconMessage(vol)
  	} else if (command === 'fp') {
   		fingerprintingMessage(vol)
  	}
    if (isCasual) {
      bot.sendMessage(vol.id, {text: "Once you understood the steps please write 's' when you start and then 'd' when you are done. You can also write 'r' if you want to not do the task before you have written 'd'. "})
    }
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
          bot.sendMessage(ids.carlId, {text: globalWarThreashold + ":" + globalAskThreashold + ":" + globalSendThreashold });
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
         bot.sendMessage(recipientId, {text: "You have " + jsonContent.volunteers + " volunteers" + "\nTasks: " + jsonContent.workPool});

         var startWeight = 1 / Number(values[1]); // Weight/volunteers
         for (var i = 0; i < Number(values[1]); i++) {
           globalWeightArray.push(startWeight);//Volunteers weight
           globalStartTime[i] = 1 * constants.MS_IN_MIN; // start up times
           globalDoneTime[i] = 1 * constants.MS_IN_MIN; // start up times
           volunteers.push(ids.idArray[i].toString());//Volunteers Ids
           bot.sendMessage(ids.idArray[i], {text: "Hello volunteer: " + (i +1) + "\nWeight: " + globalWeightArray[i] + "\nWe're doing a casual deployment. Over time you will be asked if you have time to do work..." });
         }
         tasks.loadJSON("tasks.json", (tasksArray) => {
          setTimeout(oneRound, 20 * 1000);
          globalCasStart = Date.now();
         });
}