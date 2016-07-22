var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var fs = require("fs")
var app = express();

var Ids = require('./botIds.js');
var ids = new Ids();
var Data = require('./getData.js');
var algoVE = require('./algorithumVE.js');

console.log("Carl id: " + ids.carlId);
console.log("Alej id: " + ids.alejId);
console.log(algoVE.getCurrentTime());

var g = 0;
var globalAvg = 1;
var globalBest = 0;

var globalWeightArray = [];//[]
var globalTaskArray = [];//[] all tasks like workPool
var globalVolunteers = [];//[] their ids
var globalVolTaskArray = [];//[][] all distributed tasks a task is time
var globalRealTimeArray = [];//[][] all distributed done tasks, a task is done time
//Time is done in seconds
var globalDoneTime = [];
var globalStartTime=[];
var globalPredictTime = 100;
var globalMult = 0.3;

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
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {

          g = g + 1 ;
            if (!kittenMessage(event.sender.id, event.message.text) || !mapMessage(event.sender.id, event.message.text)){
                volunteerEventMessage(event.sender.id, event.message.text);
                sendMessage(event.sender.id, {text: g + " For debugging echo: " + event.message.text + "\n Id:" + event.sender.id + "\n Time:" +algoVE.getCurrentTime()});

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

function startASMessage(recipientId, text){

  globalTaskArray = [];
  globalVolTaskArray = [];
  globalWeightArray = [];
  globalStartTime = [];
  text = text || "";
  text = text.toLowerCase();
  var values = text.split(" ");
      if(values[0].toLowerCase() === 'startas' && values.length == 6){

          var contents = fs.readFileSync("botData.json");
          var jsonContent = JSON.parse(contents);
          jsonContent.timePerTask = Number(values[1]);
          jsonContent.numOfTask = Number(values[2]);
          jsonContent.askTime = Number(values[3]);
          jsonContent.volunteers = Number(values[4]);
          jsonContent.workPool = jsonContent.numOfTask;
          fs.writeFileSync("botData.json", JSON.stringify(jsonContent));
          sendMessage(recipientId, {text: "Volunteers: " + jsonContent.volunteers + "\nTasks: " + jsonContent.numOfTask});
          // JSON startas, 1, 120, 3, 5
          var startWeight = 1 / Number(values[4]); // Weight/volunteers

          for (var i = 0; i < Number(values[4]); i++) {
            globalWeightArray.push(startWeight);//Volunteers weight
            globalVolTaskArray.push([]); //Start the volunteer weight array
            globalStartTime.push([]);
            globalDoneTime.push([]);
            globalVolunteers.push(ids.idArray[i].toString());//Volunteers Ids
            sendMessage(ids.idArray[i], {text: "Hello volunteer: " + (i +1) + "\nWeight: " + globalWeightArray[i] + "\nInstructions:" });
            //  SEND INSTRUCTIONS
            sendInstructions(values[5],ids.idArray[i]);
          }
          makeglobalTaskArray(Number(jsonContent.numOfTask),Number(jsonContent.timePerTask));
          for (var vol = 0; vol < Number(values[4]); vol++) {
            for(var task = 0;task < jsonContent.numOfTask*globalWeightArray[vol]; task++){
              if(globalTaskArray.length > 0){
                  globalVolTaskArray[vol].push(globalTaskArray.pop());
              }
            }
          }
          for(var i =0; i < globalVolTaskArray.length; i++){
          sendMessage(ids.carlId, {text: "Vol: " + (i+1) + "[" + globalVolTaskArray[i] + "]"});
          sendMessage(ids.idArray[i], {text: "Your tasks: " + "[" + globalVolTaskArray[i] + "]" });
          }
          return true;
       }
     return false;
};

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

function makeglobalTaskArray(len,time){
  for(var i = 0; i <  len; i++){
    //Length of task
    globalTaskArray.push(time);
  }
    sendMessage(ids.carlId, {text: "Global tasks: " + "[" + globalTaskArray + "]"});
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
  for (var i = 0; i < jsonContent.volunteers; i++) {
    arrayOfIds.push(ids.idArray[i].toString());
  }
  //) && arrayOfIds.includes(recipientId)
  if (values[0] === 'd' || values[0] === 'done'){
    if(isInArray(recipientId.toString(),arrayOfIds)){

        var volIndex = arrayOfIds.indexOf(recipientId);
        if(jsonContent.workPool > 0){
        jsonContent.workPool = jsonContent.workPool - 1;// THIS SHOULD BE globalTaskArray
        fs.writeFileSync("botData.json", JSON.stringify(jsonContent));
            }
        if(jsonContent.workPool > 0){
         globalDoneTime[volIndex] = Number(algoVE.getCurrentTime()); //TODO CHANGE THIS IF STATMENT
         if(globalVolTaskArray[volIndex].length != 0){
              var xi =  globalVolTaskArray[volIndex][0] / (globalDoneTime[volIndex] - globalStartTime[volIndex]);
           if(xi > globalBest){
             globalBest = xi;
           }
           globalAvg = ((globalAvg*(globalWeightArray.length - 1))/globalWeightArray.length) - xi/globalWeightArray.length;
           var curWeight = (xi - (globalAvg/2)) / (globalBest - (globalAvg/2));
           var newWeight = ((globalWeightArray[volIndex])*(1 - globalMult)) + curWeight*globalMult;
           sendMessage(recipientId, {text: newWeight + "::" + globalWeightArray[volIndex] + "::" + curWeight });
           var subtract = (newWeight - globalWeightArray[volIndex])/(globalWeightArray.length - 1);
           globalWeightArray[volIndex] = newWeight;

           for (var i = 0; i < globalWeightArray.length; i++) {
             if(i != volIndex){
                globalWeightArray[i] = globalWeightArray[i] - subtract;}
           }

           sendMessage(recipientId, {text: "sub: " + subtract + "::[" + globalWeightArray + "]::" + curWeight });
           /*
           Update array with single value, then subtract to all, then reassigntasks
           */

             //TODO This is where you reassign.
             //TODO BREAKS IF GIVEN A NUMBER THAT IS NOT NEAT
         }else{
           sendMessage(recipientId, {text: "You don't have any more tasks. But there are still these left. [" + globalVolTaskArray + "]"});
         }

        sendMessage(recipientId, {text: "Thank you, these are the total of tasks left: " + jsonContent.workPool + "\nMore instructions..."});
        sendMessage(recipientId, {text: "Vol: " + volIndex + " you ended at " +   globalDoneTime[volIndex]});
      }else {
        DoneMessage(recipientId);
      }return true;}
    }else if (values[0] === 'h' || values[0] === 'help') {
      //TODO help module
       sendMessage(recipientId, {text: "help "});
      return true;
    }else if (values[0] === 'n' || values[0] === 'next') {
      //TODO next module
      sendMessage(recipientId, {text: "next "});
      return true;
    }else if (values[0] === 's' || values[0] === 'start') {
      if(isInArray(recipientId.toString(),arrayOfIds)){

          var volIndex = arrayOfIds.indexOf(recipientId);
      // start module
      globalStartTime[volIndex] = Number(algoVE.getCurrentTime());
      sendMessage(recipientId, {text: "Vol: " + volIndex + " you started at " +   globalStartTime[volIndex]});
    }
      return true;
}
    return false;
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
