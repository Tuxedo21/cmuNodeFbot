var fs = require("fs")
var Ids = require('../botIds.js')
require('./deployment')
require('./volunteer')
const bot = require('../bot.js')
const bookshelf = require('../bookshelf')

const Task = bookshelf.Model.extend({
  tableName: 'tasks',
  deployment: function() {
    return this.belongsTo('Deployment')
  },
  assignedVolunteer: function() {
    return this.belongsTo('Volunteer')
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

  		bot.sendMessage(ids.carlId, {text: "Global tasks: " + "[" + getAllTasks() + "]"});
  		console.log(getAllTasks());
  		callback(getAllTasks());
  });

}