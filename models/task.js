var fs = require("fs")
var Ids = require('../botIds.js')
require('./deployment')
require('./volunteer')
const bookshelf = require('../bookshelf')

const _ = require('lodash')

const Task = bookshelf.Model.extend({
  tableName: 'tasks',
  deployment: function() {
    return this.belongsTo('Deployment')
  },
  assignedVolunteer: function() {
    return this.belongsTo('Volunteer', 'volunteer_fbid')
  },
  dependencies: function() {
    return this.belongsToMany('Task', 'dependencies', 'parent', 'child')
  },
  start: function() {
      return this.save({startTime: new Date()})
  },
  finish: function() {
      return this.save({completed: true, doneTime: new Date()}, {patch: true})
  },
  virtuals: {
    hasOutstandingDependancies: function() {
    return this.related('dependencies').filter((t) => !t.completed).length
    },
    estimatedTimeMin: function() {
      const int = _.defaults(this.get('estimatedTime'), {hours: 0, minutes: 0, seconds: 0})
      return int.hours * 60 + int.minutes + int.seconds / 60
    }
  }
})

module.exports = bookshelf.model('Task', Task)

let loadJSON = (jsonFile, callback) => {
	fs.readFile(jsonFile, (contents) => {
  		var jsonContent = JSON.parse(contents);
  		jsonContent.tasks.forEach((task) => {
    		console.log(task.time + " " + task.type);
    		addTask({
          time: task.time,
          startTime: null,
          endTime: null,
          type: task.type,
          assignedVolunteer: null,
        });
  		})

  		//bot.sendMessage(ids.carlId, {text: "Global tasks: " + "[" + getAllTasks() + "]"});
  		console.log(getAllTasks());
  		callback(getAllTasks());
  });

}