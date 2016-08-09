
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


module.exports.sendInstructions = function(command, vol) {
	if (command === 'bm') {
    	batteryMessage(vol)
  	} else if (command === 'bd') {
    	beaconMessage(vol)
  	} else if (command === 'fp') {
   		fingerprintingMessage(vol)
  	}
}