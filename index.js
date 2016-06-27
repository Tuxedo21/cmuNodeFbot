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
                //mapMessage(event.sender.id, event.message.text);
                sendMessage(event.sender.id, {text: "Echo: " + event.message.text });
                    }
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

          message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Is this tha place?" + mapURL,
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
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
