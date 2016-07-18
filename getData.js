var fs = require("fs");

exports.data = function(){

  var contents = fs.readFileSync("botData.json");
  var jsonContent = JSON.parse(contents);
  return jsonContent;


}

exports.texts = function(){

  var contents = fs.readFileSync("texts.json");
  var jsonContent = JSON.parse(contents);
  return jsonContent;


}


exports.linkes = function(){

  var contents = fs.readFileSync("links.json");
  var jsonContent = JSON.parse(contents);
  return jsonContent;


}
