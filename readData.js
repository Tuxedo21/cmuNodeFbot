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
  console.log("Synchronous read from readData:\n" + data.toString());
  return data
}

exports.writeData = function(text){
console.log("Going to write into existing file");
fs.writeFile('data.txt', text,  function(err) {
   if (err) {
       return console.error(err);
   }
   console.log("Data written successfully!");
   fs.readFile('data.txt', function (err, data) {
      if (err) {
         return console.error(err);
      }
      console.log("Asynchronous read from writeData: " + data.toString());
   });
});
}
