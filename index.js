var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
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
                mapMessage(event.sender.id, event.message.text);
                volunteerMessage(event.sender.id, event.message.text);
                greetingsMessage(event.sender.id, event.message.text);
                sendMessage(event.sender.id, {text: "For debbuggin echo: " + event.message.text });
            }
        } else if (event.postback) {
            console.log("Postback received: " + JSON.stringify(event.postback));
        }
    }
    res.sendStatus(200);
});
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
  //    text = text || "";
      if(values[0] === 'address'){
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
                                "title": "I like this",
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
    var values = text.split(' ');
    if (values[0] === 'volunteer') {
      var youAre = "You are the volunteer number ";
      var finalimageUrl = "https://scontent.xx.fbcdn.net/v/t1.0-9/13510876_1226719430681033_8972632654416934192_n.jpg?oh=4c1503e581e80d8d86e028536a608506&oe=57F87E3F";
      var blueImageUrl = "https://scontent.xx.fbcdn.net/v/t1.0-9/13533270_10154272438778535_6610747476267727156_n.jpg?oh=2e6fad4cc86cc96781636a1488847e7b&oe=57FCED30";
      var redImageUrl = "https://scontent.xx.fbcdn.net/v/t1.0-9/13510940_10154272438783535_3809594659337214943_n.jpg?oh=b5d74bbe3c4dcde1ec137bd9ad8bb702&oe=57F1DC9B";
      var pinkImageUrl = "https://scontent.xx.fbcdn.net/v/t1.0-9/13439091_10154272438828535_2387518102360378023_n.jpg?oh=70b18523768bbaaf8ca7b8aabada79a7&oe=58005170";
      if(values[1] === 'one' || values[1] === '1'){
        var imageUrl = pinkImageUrl;

      }else if (values[1] === 'two' || values[1] === '2'){
          var imageUrl = blueImageUrl;
      }else if (values[1] === 'three' || values[1] === '3') {
          var imageUrl = redImageUrl;
      }else {
        var imageUrl = finalimageUrl;
      }
            message = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "Work Map",
                            "subtitle": youAre + values[1] + ", your task today is to be a part of beacon deployment.",
                            //"text":youAre + values[1] + ", your task today is to place beacons in the area show on the map. Remember the rules: bla bla ",
                            "image_url": imageUrl ,
                            "buttons": [{
                                "type": "web_url",
                                "url": imageUrl,
                                "title": "Show Image"
                                }, {
                                "type": "postback",
                                "title": "I got it",
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
    var values = text.split(' ');
    if (values[0] === 'hello' || values[0] === 'hi' || values[0] === 'hey') {
            sendMessage(recipientId, {text: "Greetings human, I am the luzDeploy bot. I was created by CMU's HCI team at the biglab! My job is to help you make the world a better place for the handicap. Please tell me which volunteer are you? By writing 'volunteer <number>'(for todays deployment there are only volunteers one two and three)"});
            return true;
    }
    return false;
};


function instructionsMessage(recipientId, text) {
    text = text || "";
    var values = text.split(' ');
    if (values[0] === 'one' || values[0] === 'two' || values[0] === 'three' || values[0] === '1' || values[0] === '2' || values[0] === '3') {
            sendMessage(recipientId, {text: "Your Instruccions"});
            return true;
    }
    return false;
};
