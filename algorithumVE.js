//READ INPUT DATA AND PLACE IN JSON IF NO INPUT DATA USE JSON AND READ
exports.readStartingPoints = function(){

}

exports.startAlgorithm = function(){

}

exports.getCurrentTime = function(){

var date = new Date();
var current_hour = date.getHours();
var current_min = date.getMinutes();
var current_sec = date.getSeconds();

console.log(current_hour+ ":"+ current_min +":" + current_sec);
console.log("" +current_hour+ current_min+ current_sec);
//TODO Add the zero error
return "" +current_hour+ current_min+ current_sec;
}
