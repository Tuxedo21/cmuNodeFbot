module.exports = function Instructions() {
    //Placing Beacons
    this.placeBeacons = "You will be placing beacons.\n Place a beacon where you see a red square and a number inside on your map as high as you can and always on the wall.";
    this.numBeacons = " Only place the beacons that are assigned to you. When you have placed a beacon please tell me the number of the beacon (number in the red square) and the serial code on the back of the beacon (four digit code, this is case sensitive). With the following format: [17, xF5r]. ";
    //Battery Maintenance
    this.firstBatt = "Your task will be beacon maintenance. Use the map provided to you to find the beacons you will work with and the range given to you. Once you have found your first beacon please take the beacon down, open it and replace or place a battery in it.";
    this.secondBatt = "Send me a message with the number of the number of the beacon (number in the red square), the serial code on the back of the beacon (four digit code, this is case sensitive) and an R for replace or N for a new battery. With the following format: [17, xF5r, N].";
    this.thirdBatt = "If their is a beacon missing PLEASE send me a picture of where it should be so i know! If that is not enough,read the instructions again. :) And if that still is not enough, don't complain you have a body and a mind! I know you can figure it out.";
    //Fingerprinting
    this.expInterface = "Explain";
    this.expWalk = "Walk back and fourth"
    this.applink = "AppLink";
    //Greetings
    this.greetings = "Greetings human, I am the luzDeploy bot. I was created by CMU's HCI team at the biglab! My job is to help you make the world a better place for the handicap. Please tell me which volunteer are you? By writing 'volunteer <number>' (for todays deployment there are only volunteers four and five)";
}
