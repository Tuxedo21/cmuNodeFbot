
function beaconMessage(vol) {
	const m = Data.texts().placingBeacons
  	setTimeout(vol.sendMessage, 2 * 1000, {text: m.placingBeacons1 });
  	setTimeout(vol.sendMessage, 2 * 1000, {text: m.placingBeacons2 });
  	const imageMessage = {
    	"attachment": {
      		"type": "template",
      		"payload": {
        		"template_type": "generic",
        		"elements": [{
          			"title": "Map",
          			"subtitle": "Here you can see your deployment map.",
          			"item_url":  Data.linkes().placingBeaconsLinks.blueImage,
         			"image_url":  Data.linkes().placingBeaconsLinks.blueImage,
          			"buttons": [{
            			"type": "web_url",
            			"url": blueImage,
            			"title": "Open Web URL"
          			}]
        		}]
      		}
    	}
    }
    setTimeout(vol.sendMessage, 9 * 1000, imageMessage)
}


function batteryMessage(vol) {
    const m = Data.texts().batteryMaintenance
    setTimeout(vol.sendMessage, 2 * 1000, {text: m.batteryMaintenance1})
    setTimeout(vol.sendMessage, 2 * 1000, {text: m.batteryMaintenance2})
    const lnks = Data.linkes().batteryManagementLinks
    const sideImageUrl = lnks.batterySides
    const explodeImageUrl = lnks.batteryExplode
    const nailImageUrl = lnks.batteryManagementLinks

    const imageMessage = {
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
    }
    setTimeout(vol.sendMessage, 9 * 1000, imageMessage)
  }

  function fingerprintingMessage(vol) {
	setTimeout(vol.sendMessage, 2 * 1000, {text: Data.texts().fingerprinting.fingerprinting1})
	setTimeout(vol.sendMessage, 2 * 1000, {text: Data.texts().fingerprinting.fingerprinting2})
	const imageMesage = {
    	"attachment": {
      		"type": "image",
      		"payload": {
       			"url": Data.linkes().fingerprintingLinks.redImage,
			},
    	}
	}
  setTimeout(vol.sendMessage, 9 * 1000, imageMessage)
}

const text = {
    "batteryMaintenance": {"batteryMaintenance1":  "Your task will be beacon maintenance. Please go to the location of beacon number X as seen on the map. Once there you will find a beacon take it down and open it as described with the images below.",
                           "batteryMaintenance2":  "Measure the voltage of the battery by placing the battery in between the multimeter's probes. As shown in the image below. If the battery level is less than 2.8 volts or no battery is found place a new battery as shown in the image below.",
                           "batteryMaintenance3":  " If no beacon is found send “MISSING”."},

    "placingBeacons": {"placingBeacons1" : "You will be placing beacons. Go to the supply station that is marked with a red square on the map. Once there grab a batch of beacons. Then go to the position that is marked with a blue circle on the map with the same number as the first beacon.",
                       "placingBeacons2" :  "Please place the beacon at about 10 ft of height on the wall. Repeat this for each other beacon. Once done with this batch write “Done”."
                    },

    "fingerprinting": {"fingerprinting1" : "You will be collecting data to help navigate the blind. Please go the location of X as shown on the map. Place you back against the wall so that you are facing the direction towards location Y.",
                       "fingerprinting2" : "Once you click on the link provided below an app will spawn on your phone. Press the start button and, once the countdown reaches zero take a step towards location Y.  Repeat these two operations until you have arrived at location Y. Now click on the following link."
                     }
}


module.exports.sendInstructions = function(command, vol) {
	if (command === 'bm') {
    	batteryMessage(vol)
  	} else if (command === 'bd') {
    	beaconMessage(vol)
  	} else if (command === 'fp') {
   		fingerprintingMessage(vol)
  	}
}