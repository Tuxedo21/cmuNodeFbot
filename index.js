var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var fs = require("fs")
var app = express();

var Ids = require('./botIds.js');
var ids = new Ids();
var Helpers = require('./helper.js');
var Data = require('./getData.js');

//Helpers.helloConsole();
//ReadData.readData()


console.log("Carl id: " + ids.carlId);
console.log("Alej id: " + ids.alejId);

// var contents = fs.readFileSync("botData.json");
// var jsonContent = JSON.parse(contents);
// var number = jsonContent.volunteers + 2;
// console.log(number);
// jsonContent.volunteers = 5;
// jsonContent.timePerTask = 5;
// fs.writeFileSync("botData.json", JSON.stringify(jsonContent));


//    var message = Data.texts().batteryMaintenance.batteryMaintenance1;
//    setTimeout(function(){console.log(message);}, 2000);


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
            if (!kittenMessage(event.sender.id, event.message.text)){

                volunteerEventMessage(event.sender.id, event.message.text);
                sendMessage(event.sender.id, {text: "For debugging echo: " + event.message.text + "\n Id: " + event.sender.id});
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
  text = text || "";
  text = text.toLowerCase();
  var values = text.split(" ");
      if(values[0].toLowerCase() === 'startas' && values.length == 6){
          var contents = fs.readFileSync("botData.json");
          var jsonContent = JSON.parse(contents);
          jsonContent.numOfTask = Number(values[1]);
          jsonContent.volunteers = Number(values[4]);
          jsonContent.workPool = jsonContent.numOfTask;
          fs.writeFileSync("botData.json", JSON.stringify(jsonContent));
          sendMessage(recipientId, {text: "volunteers: " + jsonContent.volunteers});
            // startas, 1, 120, 3, 5
          for (var i = 0; i < values[4]; i++) {
            sendMessage(ids.idArray[i], {text: "Hello volunteer: " + (i +1) + "\nInstructions..."});
            if(values[5] === 'bm'){
                batteryMessage(ids.idArray[i]);
            }
            else if (values[5] === 'bd') {
                beaconMessage(ids.idArray[i]);
            }


            //  SEND INSTRUCTIONS
          }

          return true;
       }
     return false;
};

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
      //Modify JSON!!
        jsonContent.workPool = jsonContent.workPool - 1;
        fs.writeFileSync("botData.json", JSON.stringify(jsonContent));
        if(jsonContent.workPool > 0){
        sendMessage(recipientId, {text: "Thank you: " + jsonContent.workPool + "\nMore instructions..."});
      }else {
        DoneMessage(recipientId);
      }
        return true;
      }
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

// send rich message with kitten
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
// send rich message with kitten
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

function volunteerMessage(recipientId, text) {
    text = text || "";
    text = text.toLowerCase();
    var values = text.split(' ');
    if (values[0] === 'volunteer') {
      var youAre = "You are volunteer ";
      var blueImageUrl = "https://scontent.xx.fbcdn.net/v/t1.0-9/13533270_10154272438778535_6610747476267727156_n.jpg?oh=2e6fad4cc86cc96781636a1488847e7b&oe=57FCED30";
      var redImageUrl = "https://scontent.xx.fbcdn.net/v/t1.0-9/13510940_10154272438783535_3809594659337214943_n.jpg?oh=b5d74bbe3c4dcde1ec137bd9ad8bb702&oe=57F1DC9B";
      var pinkImageUrl = "https://scontent.xx.fbcdn.net/v/t1.0-9/13439091_10154272438828535_2387518102360378023_n.jpg?oh=70b18523768bbaaf8ca7b8aabada79a7&oe=58005170";
      if(values[1] === 'one' || values[1] === '1'){
        var imageUrl = pinkImageUrl;
      }else if (values[1] === 'two' || values[1] === '2'){
          var imageUrl = blueImageUrl;
      }else if (values[1] === 'three' || values[1] === '3') {
          var imageUrl = redImageUrl;
      }
            message = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "Work Map",
                            "subtitle": youAre + values[1] + ", your tasks today are part of beacon deployment.",
                            //"text":youAre + values[1] + ", your task today is to place beacons in the area show on the map. Remember the rules: bla bla ",
                            "image_url": imageUrl ,
                            "buttons": [{
                                "type": "web_url",
                                "url": imageUrl,
                                "title": "Show Image"
                                }, {
                                "type": "postback",
                                "title": "Write: I'm done :)",
                                "payload": "User " + recipientId + " likes kitten " + imageUrl,
                            }]
                        }]
                    }
                }
            };
            sendMessage(recipientId, message);
            instructionsMessage(recipientId,values[1]);
            return true;
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

function instructionsMessage(recipientId, text) {
    if (text === 'one' || text === 'two' || text === 'three' || text === '1' || text === '2' || text === '3' || text === '4' || text === '5' || text === 'five' || text === 'four') {
      var message = "";
      var messagetwo = "";
      var messagethree = "";
      var messagefour = "";
            if(text === 'three' || text === '3'){
              //three red
              var message = "You will be placing beacons.\n Place a beacon where you see a red square on your map as high as you can and always on the wall.";
            }
            else if(text === 'two' || text === '2'){
            //two blue
          var message = "You will be placing beacons.\n Place a beacon where you see a blue square on your map as high as you can and always on the wall.";
            }
            else if(text === 'one' || text === '1'){
            //one pink
            var message = "You will be placing tape on the floor.\nPlace a small pice of tape from the the first beacon in a hallway every meter. Please repeat this for each hallway. For today there are four in total. At the end it should look a little like the map given to you.";
            }
            else if(text === 'four' || text === '4' || text === 'five' || text === '5'){
              var message = "The visually impaired need your help. Your task will be of battery beacon maintenance. These beacons are their eyes. Sometimes the can go out, we need you to make sure they are not out.";
              var messagetwo =  "The instructions are simple. Use the map provided to find the beacons you will work with. Once you found a beacon please take the beacon down, open it and replace or place a battery in it.";
              var messagethree = "Then send me the four digit code on the back of the beacon please. If you need some more help on how to do this, please use the images provided.";
              var messagefour = "If their is a beacon missing PLEASE send me a picture of where it should be so i know. If that is not enough, well read it again. And if that still is not enough, don't complain you have a body and a mind! You can figure it out.";
            }

             sendMessage(recipientId, {text: message});
             sendMessage(recipientId, {text: messagetwo});
             sendMessage(recipientId, {text: messagethree});
             sendMessage(recipientId, {text: messagefour + "When done please say I'm done :)"});
            return true;
    }
    return false;
};
function DoneMessage(recipientId) {
    sendMessage(recipientId, {text: "Thank you very much!\nYou just helped by giving light to the visually impaired.\n\nI am still in research phase, please answer this survey so i can become better at helping.\n\n"+ "https://docs.google.com/forms/d/1hcwB18hnyniWFUQAQDm2MSMdlQQL4QYOG_Md9eFsQnE/viewform"});
    return true;
};
//WORK ON THISS!!
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
