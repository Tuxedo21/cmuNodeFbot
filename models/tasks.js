var fs = require("fs");
var Ids = require('./botIds.js');
var ids = new Ids();

var taskArray = [];

function getAllTasks() {
	return taskArray;
}

exports.getAll = getAllTasks;

function addTask(task) {
	taskArray.push(task);
}

exports.add = addTask;

exports.pop = () => taskArray.pop();

exports.clear = () => { taskArray = []; };

exports.loadJSON = (jsonFile, callback) => {
	fs.readFile(jsonFile, (contents) => {
  		var jsonContent = JSON.parse(contents);
  		jsonContent.tasks.forEach((task) => {
    		console.log(task.time + " " + task.type);
    		addTask([task.time,task.type]);
  		})

  		messenger.send(ids.carlId, {text: "Global tasks: " + "[" + getAllTasks() + "]"});
  		console.log(getAllTasks());
  		callback(getAllTasks());
  });

}