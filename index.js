var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var async = require('async');
var fs = require("fs")
var app = express();


var Ids = require('./botIds.js');
var ids = new Ids();
var Data = require('./getData.js');
var algoVE = require('./algorithumVE.js');

// console.log("Carl id: " + ids.carlId);
// console.log("Alej id: " + ids.alejId);
// console.log(algoVE.getCurrentTime());


// function loopOne(){
//   while (true) {
//       setTimeout(function() { console.log("hi"); }, 200);
//   }
//
// }
//
// function loopTwo(){
//     while (true) {
//   setTimeout(function() { console.log("hey"); }, 200);
//   }
// }
//
//
// async.parallel([
//     function(callback) {
//         setTimeout(function() {
//           loopTwo();
//         }, 200);
//     },
//     function(callback) {
//         setTimeout(function() {
//             loopOne();
//         }, 100);
//     }
// ],
// // optional callback
// function(err, results) {
//     // the results array will equal ['one','two'] even though
//     // the second function had a shorter timeout.
// });

var g = 0;
var globalAvg = 1;
var globalBest = 0;
var isCasual;

var globalWeightArray = [0.25,0.25,0.25,0.25];//[]
var globalTaskArray = [];//[] all tasks like workPool
var globalVolunteers = [];//[] their ids
var globalVolTaskArray = [];//[][] all distributed tasks a task is time
var globalRealTimeArray = [];//[][] all distributed done tasks, a task is done time
//Time is done in seconds
var globalDoneTime = [];
var globalStartTime = [];
var globalPredictTime = 100;
var globalMult = 0.3;
//Threasholds
var globalWarThreashold = 0;
var globalAskThreashold = 0;
var globalSendThreashold = 0;
//Casual times
var globalRoundRobinTime= 10000000000000;

//getTasks("tasks.json");
//sendMentor();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));
// Server frontpage
app.get('/', function (req, res) {
    res.send('This is TestBot Server');
});
// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});
// handler receiving messages

/* Ask if Casual,   */
//setInterval(roundRobin, (globalRoundRobinTime*60000));

app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
          g = g + 1 ;
          globalCasCheck = algoVE.getCurrentTime();
            if (!kittenMessage(event.sender.id, event.message.text) || !mapMessage(event.sender.id, event.message.text)){
                volunteerEventMessage(event.sender.id, event.message.text);
                sendMessage(event.sender.id, {text: g + " For debugging echo: " + event.message.text + "\n Id:" + event.sender.id + "\n Time:" +algoVE.getCurrentTime()});
            //    sendMessage(ids.carlId, {text: g + " For debugging: " + globalCasCheck+ "-" + globalCasStart + " = " (globalCasCheck - globalCasStart) });
              if(event.sender.id == ids.carlId){
                 startASMessage(event.sender.id, event.message.text);
                }
            }
          } else if (event.postback) {
              console.log("Postback received: " + JSON.stringify(event.postback));
          }
      }
      res.sendStatus(200);
  });

function updateBotData(volunteersNum){

  var contents = fs.readFileSync("botData.json");
  var jsonContent = JSON.parse(contents);
  var taskContent = fs.readFileSync("tasks.json");
  var jsonTaskContent = JSON.parse(taskContent);

  jsonContent.workPool = jsonTaskContent.tasks.length;
  jsonContent.volunteers = volunteersNum;
  fs.writeFileSync("botData.json", JSON.stringify(jsonContent));
  sendMessage(recipientId, {text: "Volunteers: " + jsonContent.volunteers + "\nTasks: " + jsonContent.workPool});

  return true;
}

function updateAndKickOff(until){
  for (var vol = 0; vol < until; vol++) {
      if(globalTaskArray.length > 0){
          globalVolTaskArray[vol].push(globalTaskArray.pop());
      }
  }
  for(var i =0; i < until; i++){
  sendMessage(ids.carlId, {text: "Vol num: " + (i+1) + "[" + globalVolTaskArray[i] + "]"});
  sendMessage(ids.idArray[i], {text: "Your task should take: " + "[" + globalVolTaskArray[i][0][0] + "] minutes." });
  //  SEND INSTRUCTIONS
  sendInstructions(globalVolTaskArray[i][0][1].toString(),ids.idArray[i]);
  }
}

function roundRobin(){
  if(isCasual){
    startSending();
  }
}

function startASMessage(recipientId, text){

  globalTaskArray = [];
  globalVolunteers = [];
  globalVolTaskArray = [];
  globalWeightArray = [];
  globalStartTime = [];
  text = text || "";
  text = text.toLowerCase();
  var values = text.split(" ");
      if(values[0].toLowerCase() === 'startwith' && values.length == 2){  // JSON startwith 3
         isCasual = false;
        //  updateBotData(3);

          var contents = fs.readFileSync("botData.json");
          var jsonContent = JSON.parse(contents);
          var taskContent = fs.readFileSync("tasks.json");
          var jsonTaskContent = JSON.parse(taskContent);

          jsonContent.workPool = jsonTaskContent.tasks.length;
          jsonContent.volunteers = Number(values[1]);
          fs.writeFileSync("botData.json", JSON.stringify(jsonContent));
          sendMessage(recipientId, {text: "Volunteers: " + jsonContent.volunteers + "\nTasks: " + jsonContent.workPool});

          var startWeight = 1 / Number(values[1]); // Weight/volunteers
          for (var i = 0; i < Number(values[1]); i++) {
            globalWeightArray.push(startWeight);//Volunteers weight
            globalVolTaskArray.push([]); //Start the volunteer weight array
            globalStartTime[i] = 1000000; // start up times
            globalDoneTime[i] = 1; // start up times
            globalVolunteers.push(ids.idArray[i].toString());//Volunteers Ids
            sendMessage(ids.idArray[i], {text: "Hello volunteer: " + (i +1) + "\nWeight: " + globalWeightArray[i] + "\nInstructions:" });
          }
          getTasks("tasks.json");//MakesglobalTaskArray
          updateAndKickOff(globalVolTaskArray.length);
          setThreasholds(startWeight);
          sendMessage(ids.carlId, {text: globalWarThreashold + ":" + globalAskThreashold + ":" + globalSendThreashold });
          return true;
       }

       else if (values[0].toLowerCase() === 'startcas' && values.length == 3) {
         isCasual = true;
         var contents = fs.readFileSync("botData.json");
         var jsonContent = JSON.parse(contents);
         var taskContent = fs.readFileSync("tasks.json");
         var jsonTaskContent = JSON.parse(taskContent);

         jsonContent.workPool = jsonTaskContent.tasks.length;
         jsonContent.volunteers = Number(values[1]);
         jsonContent.askTime = Number(values[2]);
         globalRoundRobinTime = Number(values[2]);
         fs.writeFileSync("botData.json", JSON.stringify(jsonContent));
         sendMessage(recipientId, {text: "You have " + jsonContent.volunteers + " volunteers" + "\nTasks: " + jsonContent.workPool});

         var startWeight = 1 / Number(values[1]); // Weight/volunteers
         for (var i = 0; i < Number(values[1]); i++) {
           globalWeightArray.push(startWeight);//Volunteers weight
           globalVolTaskArray.push([]); //Start the volunteer weight array
           globalStartTime[i] = 1; // start up times
           globalDoneTime[i] = 1; // start up times
           globalVolunteers.push(ids.idArray[i].toString());//Volunteers Ids
           sendMessage(ids.idArray[i], {text: "Hello volunteer: " + (i +1) + "\nWeight: " + globalWeightArray[i] + "\nWe're doing a casual deployment. Over time you will be asked if you have time to do work..." });
         } getTasks("tasks.json");
          setTimeout(function(){startSending();}, 20000);
          globalCasStart = Number(algoVE.getCurrentTime());
          return true;
       }
     return false;
};

function checkCasTimes(){
  var contents = fs.readFileSync("botData.json");
  var jsonContent = JSON.parse(contents);
  if((globalCasCheck - globalCasStart) >= jsonContent.askTime){
      startSending();
  }
}

function startSending(){
  for (var i = 0; i < globalVolunteers.length; i++) {
    if(globalVolTaskArray[i].length < 1){
        globalVolTaskArray[i].push(globalTaskArray.pop());
        sendMessage(ids.carlId, {text: "Vol num: " + (i+1) + "[" + globalVolTaskArray[i] + "]"});
        sendMessage(globalVolunteers[i], {text: "Your task should take: " + "[" + globalVolTaskArray[i][0][0] + "] minutes." });
        //  SEND INSTRUCTIONS
        sendInstructions(globalVolTaskArray[i][0][1].toString(),globalVolunteers[i]);
        sendMessage(globalVolunteers[i], {text: "Will you do this? Write 's' if yes and to start, 'r' if no"});
      }
  }
}

function setThreasholds(startWeight){
  globalWarThreashold = startWeight/2;
  globalAskThreashold = startWeight/3;
  globalSendThreashold = startWeight/4;
}

function sendInstructions(command,id){
  //  SEND INSTRUCTIONS
  if(command === 'bm'){
      batteryMessage(id);
  }else if (command === 'bd') {
      beaconMessage(id);
  } else if (command === 'fp') {
    fingerprintingMessage(id);
  }
}

// function makeglobalTaskArray(len,time){
//   for(var i = 0; i <  len; i++){
//     //Length of task
//     globalTaskArray.push(time);
//   }
//     sendMessage(ids.carlId, {text: "Global tasks: " + "[" + globalTaskArray + "]"});
// }

function getTasks(jsonFile){
  var contents = fs.readFileSync(jsonFile);
  var jsonContent = JSON.parse(contents);
  for (var i = 0; i < jsonContent.tasks.length; i++) {
  console.log(jsonContent.tasks[i].time + " " + jsonContent.tasks[i].type);
  globalTaskArray.push([jsonContent.tasks[i].time,jsonContent.tasks[i].type]);
  }
  sendMessage(ids.carlId, {text: "Global tasks: " + "[" + globalTaskArray + "]"});
  console.log(globalTaskArray);
}

function arrrayCountSum(numarray,count){
  temp = 0;
  for(var i = 0; i < count; i++ ){
    temp = temp + numarray[i];
  }
  return temp;
}

function volunteerEventMessage(recipientId, text){
  text = text || "";
  text = text.toLowerCase();
  var values = text.split(' ');
  var contents = fs.readFileSync("botData.json");
  var jsonContent = JSON.parse(contents);
  var arrayOfIds = [];
  for (var i = 0; i < jsonContent.volunteers; i++) {//Get all volunteers
    arrayOfIds.push(ids.idArray[i].toString());
   }
  if (values[0] === 'd' || values[0] === 'done'){
    //TODO check if he has started
    if(isInArray(recipientId.toString(),arrayOfIds)){//Is he a volunteer?
         var volIndex = arrayOfIds.indexOf(recipientId);//get his id
         if(jsonContent.workPool > 0){ //check if the pool is empty

           jsonContent.workPool = jsonContent.workPool - 1;// take away from the pool
           fs.writeFileSync("botData.json", JSON.stringify(jsonContent)); //update the json
           globalDoneTime[volIndex] = Number(algoVE.getCurrentTime()); //get done time

            //TODO this breaks if not done nicely
            if(globalVolTaskArray[volIndex].length != 0 && globalDoneTime[volIndex] > globalStartTime[volIndex]) {
              globalStartTime[volIndex] = 1000000;//So you cant cheat;
               var xi =  globalVolTaskArray[volIndex][0][0] / (globalDoneTime[volIndex] - globalStartTime[volIndex]); //xi for weight
               if(xi > globalBest){
                globalBest = xi;
               }
           //Dragans Cool Math
           globalAvg = ((globalAvg*(globalWeightArray.length - 1))/globalWeightArray.length) - xi/globalWeightArray.length;
           var curWeight = (xi - (globalAvg/2)) / (globalBest - (globalAvg/2));
           var newWeight = ((globalWeightArray[volIndex])*(1 - globalMult)) + curWeight*globalMult; //sendMessage(recipientId, {text: "::NW" + newWeight + "::LW" + globalWeightArray[volIndex] + "::CW" + curWeight });
           var subtract = (newWeight - globalWeightArray[volIndex])/(globalWeightArray.length - 1);
           //UPDATE WEIGHTS!
           globalWeightArray[volIndex] = newWeight;
               // mf subtract the weight of others
              for (var i = 0; i < globalWeightArray.length; i++) {
                 if(i != volIndex){
                    globalWeightArray[i] = globalWeightArray[i] - subtract;}
              }
              checkThreshold();
              //sendMessage(recipientId, {text: "old::[" + globalVolTaskArray[volIndex] + "]::" });
              sendMessage(ids.carlId, {text: "GTA::[" + globalTaskArray + "]::" });
              sendMessage(ids.carlId, {text: "sub: " + subtract + " GWA::[" + globalWeightArray + "]::" });
              globalVolTaskArray[volIndex].pop();
              if(!isCasual){
              globalVolTaskArray[volIndex].push(globalTaskArray.pop());
              //Send new task
               sendMessage(recipientId, {text: "Your task should take: " + "[" + globalVolTaskArray[volIndex][0][0] + "] minutes." });
               sendInstructions(globalVolTaskArray[volIndex][0][1],recipientId);
                }
              for(var i =0; i < globalVolTaskArray.length; i++){
              sendMessage(ids.carlId, {text: "Vol: " + (i+1) + "[" + globalVolTaskArray[i] + "]"});
              }
          }  else{
           sendMessage(recipientId, {text: "You don't have any more tasks. But there are still these left for others. [" + globalVolTaskArray + "]"});
         }
         sendMessage(recipientId, {text: "Thank you, these are the total of tasks left: " + jsonContent.workPool });
         sendMessage(recipientId, {text: "Vol: " + (volIndex + 1) + " you ended at " +   globalDoneTime[volIndex]});
       } else {
         DoneMessage(recipientId);
       }
      return true;
    }
    return false;
  }
    else if (values[0] === 'h' || values[0] === 'help') {
      //TODO breaks if you do help before a task?
      if(globalVolunteers.length > 0){
      var volIndex = arrayOfIds.indexOf(recipientId);
       sendMentor(globalWeightArray,volIndex);
       sendMessage(recipientId, {text: "We're sending help now. "});
     }
       sendMessage(recipientId, {text: "help "});
      return true;
    }else if (isCasual == true && (values[0] === 'a' || values[0] === 'ask') ) {
      sendMessage(recipientId, {text: "Once you understood the steps please write 's' when you start and then 'd' when you are done. You can also write 'r' if you want to not do the task before you have written 'd'. "});
        //TODO next module
      /*
      Get a task in the pool, and ask if he wants to do it.
      */var volIndex = arrayOfIds.indexOf(recipientId);
      if( !(globalTaskArray[volIndex] >= 1)){
            globalVolTaskArray[volIndex].push(globalTaskArray.pop());
            sendInstructions(globalVolTaskArray[volIndex][0][1],recipientId);
          }

      sendMessage(recipientId, {text: "ask "});
      /*When you accept you don't start but it will be added to you array*/
      return true;
    }else if (isCasual == true && (values[0] === 'r' || values[0] === 'reject')){
      //TODO reject module
      var volIndex = arrayOfIds.indexOf(recipientId);
      if(globalVolTaskArray[volIndex].length > 0){
        globalTaskArray.push(globalVolTaskArray[volIndex].pop());
                    }
      sendMessage(recipientId, {text: "reject "});
      /*take away from the volunteers array*/
      return true;
    }else if (values[0] === 's' || values[0] === 'start') {
      if(isInArray(recipientId.toString(),arrayOfIds)){
          var volIndex = arrayOfIds.indexOf(recipientId);
            globalStartTime[volIndex] = Number(algoVE.getCurrentTime());
            sendMessage(recipientId, {text: "Vol: " + (volIndex + 1) + " you started at " + globalStartTime[volIndex]});
            return true;
    }
      return false;
}
    return false;
}


  function checkThreshold(){
    for (var i = 0; i < globalWeightArray.length; i++) {
       if (globalWeightArray[i] < globalSendThreashold) {
          sendMessage(ids.idArray[i], {text: "We are sending a mentor to you"});
          sendMentor(globalWeightArray,i);
      }else if (globalWeightArray[i] < globalAskThreashold) {
         sendMessage(ids.idArray[i], {text: "Do you want help? If so do..."});
      }else if (globalWeightArray[i] < globalWarThreashold) {
          sendMessage(ids.idArray[i], {text: "You are lagging behind"});
      }
    }
  };

//TODO add the guy you are going to help
function sendMentor(weights,volNum){
  var maxWeight = Math.max.apply(Math,weights);
  var volIndex = weights.indexOf(maxWeight);
  sendMessage(ids.idArray[volIndex], {text: "Go help volunteer number " + (volNum + 1)});
  //console.log(volIndex);
}

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}
// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

// send rich message with kitten EASTEREGG
function mapMessage(recipientId, text){
  text = text || "";
  text = text.toLowerCase();
  var mapURL = "https://www.google.com/maps/place/";
  var values = text.split(',');
      if(values[0].toLowerCase() === 'address'){
    //https://www.google.com/maps/place/Ciprés+8,+Bosques+de+Chalco+2,+56600+Chalco+de+Díaz+Covarrubias,+Méx.,+Mexico/
    //https://www.google.com/maps/place/407+S+Craig+St,+Pittsburgh,+PA+15213/
          for (var i = 1; i < values.length; i++) {
            mapURL = mapURL + values[i];
            mapURL= mapURL.replace(/ /g,"+");
          }
          message = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Is this tha place?",
            "subtitle": "Please let me know.",
            "item_url": mapURL,
            "image_url": "https://lh3.googleusercontent.com/MOf9Kxxkj7GvyZlTZOnUzuYv0JAweEhlxJX6gslQvbvlhLK5_bSTK6duxY2xfbBsj43H=w300",
            "buttons": [{
              "type": "web_url",
              "url": mapURL,
              "title": "Check Web URL"
            }, {
              "type": "postback",
              "title": "Yes",
              "payload": "Payload for first bubble",
            }, {
              "type": "postback",
              "title": "No",
              "payload": "Payload for first bubble",
            }],
          }, {
            "title": "touch",
            "subtitle": "Your Hands, Now in VR",
            "item_url": "https://www.oculus.com/en-us/touch/",
            "image_url": "http://messengerdemo.parseapp.com/img/touch.png",
            "buttons": [{
              "type": "web_url",
              "url": "https://www.oculus.com/en-us/touch/",
              "title": "Open Web URL"
            }, {
              "type": "postback",
              "title": "Call Postback",
              "payload": "Payload for second bubble",
            }]
          }]
        }
      }
    };
            //  print out search
          sendMessage(recipientId, message);
          return true;
       }
     return false;
};
// send rich message with kitten EASTEREGG
function kittenMessage(recipientId, text) {
    text = text || "";
    text = text.toLowerCase();
    var values = text.split(' ');
    if (values.length === 3 && values[0] === 'kitten') {
        if (Number(values[1]) > 0 && Number(values[2]) > 0) {
            var imageUrl = "https://placekitten.com/" + Number(values[1]) + "/" + Number(values[2]);
            message = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "The Kitten",
                            "subtitle": "Epic kitten picture",
                            "image_url": imageUrl ,
                            "buttons": [{
                                "type": "web_url",
                                "url": imageUrl,
                                "title": "Show kitten"
                                }, {
                                "type": "postback",
                                "title": "I like this " + recipientId,
                                "payload": "User " + recipientId + " likes kitten " + imageUrl,
                            }]
                        }]
                    }
                }
            };
            sendMessage(recipientId, message);
            return true;
        }
    }
    return false;
};

function greetingsMessage(recipientId, text) {
    text = text || "";
    text = text.toLowerCase();
    var values = text.split(' ');
    if (values[0] === 'hello' || values[0] === 'hi' || values[0] === 'hey') {
            sendMessage(recipientId, {text: "Greetings human, I am the luzDeploy bot. I was created by CMU's HCI team at the biglab! My job is to help you make the world a better place for the handicap. Please tell me which volunteer are you? By writing 'volunteer <number>' (for todays deployment there are only volunteers four and five)"});
            return true;
    }
    return false;
};
function DoneMessage(recipientId) {
    sendMessage(recipientId, {text: "Thank you very much!\nYou just helped by giving light to the visually impaired.\n\nI am still in research phase, please answer this survey so i can become better at helping.\n\n"+ "https://docs.google.com/forms/d/1hcwB18hnyniWFUQAQDm2MSMdlQQL4QYOG_Md9eFsQnE/viewform"});
    return true;
};
//WORK ON THISS!!
function fingerprintingMessage(recipientId){
  setTimeout(function(){fingerprintingTextMessage(recipientId);}, 2000);
  setTimeout(function(){fingerprintingImageMessage(recipientId);}, 9000);
}
function fingerprintingTextMessage(recipientId){
  var message = Data.texts().fingerprinting;
  setTimeout(function(){sendMessage(recipientId, {text: message.fingerprinting1 });}, 2000);
  setTimeout(function(){sendMessage(recipientId, {text: message.fingerprinting2 });}, 2000);
}
function fingerprintingImageMessage(recipientId){
  var linkes = Data.linkes();
  var lnks = linkes.fingerprintingLinks;
  var redImage = lnks.redImage;
    message = {
      "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Map",
          "subtitle": "Here you can see your deployment map.",
          "item_url": redImage,
          "image_url": redImage,
          "buttons": [{
            "type": "web_url",
            "url": redImage,
            "title": "Open Web URL"
          }]
        }]
      }
    }
    };
  sendMessage(recipientId, message);
}

function batteryMessage(recipientId) {
    setTimeout(function(){batteryTextMessage(recipientId);}, 2000);
    setTimeout(function(){batteryImageMessage(recipientId);}, 9000);
};
function batteryTextMessage(recipientId) {
    var message = Data.texts().batteryMaintenance;
    setTimeout(function(){sendMessage(recipientId, {text: message.batteryMaintenance1 });}, 2000);
    setTimeout(function(){sendMessage(recipientId, {text: message.batteryMaintenance2 });}, 2000);
};
function batteryImageMessage(recipientId) {
    var linkes = Data.linkes();
    var lnks = linkes.batteryManagementLinks;
    var sideImageUrl = lnks.batterySides;
    var explodeImageUrl = lnks.batteryExplode;
    var nailImageUrl = lnks.batteryNail;
    var imageUrl = lnks.batteryNail;

      message = {
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
      };
    sendMessage(recipientId, message);
};

function beaconMessage(recipientId){
  setTimeout(function(){beaconTextMessage(recipientId);}, 2000);
  setTimeout(function(){beaconImageMessage(recipientId);}, 9000);
}
function beaconTextMessage(recipientId){
  var message = Data.texts().placingBeacons;
  setTimeout(function(){sendMessage(recipientId, {text: message.placingBeacons1 });}, 2000);
  setTimeout(function(){sendMessage(recipientId, {text: message.placingBeacons2 });}, 2000);
}
function beaconImageMessage(recipientId){
  var linkes = Data.linkes();
  var lnks = linkes.placingBeaconsLinks;
  var blueImage = lnks.blueImage;

    message = {
      "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Map",
          "subtitle": "Here you can see your deployment map.",
          "item_url": blueImage,
          "image_url": blueImage,
          "buttons": [{
            "type": "web_url",
            "url": blueImage,
            "title": "Open Web URL"
          }]
        }]
      }
    }
    };
  sendMessage(recipientId, message);
}
