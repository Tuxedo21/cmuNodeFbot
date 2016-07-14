var fs = require("fs")

// // Asynchronous read
// fs.readFile('data.txt', function (err, data) {
//    if (err) {
//        return console.error(err);
//    }
//    console.log("Asynchronous read:\n" + data.toString());
// });

exports.readData = function(){
  // Synchronous read
  var data = fs.readFileSync('data.txt');
  console.log("Synchronous read:\n" + data.toString());
  return data
}
