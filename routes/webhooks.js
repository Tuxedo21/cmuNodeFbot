// webhooks.js -- Facebook webhook handlers for Messenger API

exports.verifyToken = function(req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
};

exports.receiveEvents = function(req, res) {
  req.body.entry.forEach(function(entry) {
    entry.messaging.forEach(function(event) {
      if (event.message && event.message.text) {
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
};