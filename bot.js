var HTTPS = require('https');
var cool = require('cool-ascii-faces');
var botResponse;
var lastMessage;
var muted = 0;
var echoCoolDown = 0;

var botID = process.env.BOT_ID;

function respond() {
  var request = JSON.parse(this.req.chunks[0]);
  var botRegex = /^\/cool guy$/;
  var remindRegex = /^!remindme/;
  var helpRegex = /^!help$/;
  var muteRegex = /^!mute$/;
  console.log(request);

  echoCoolDown++;

  if (muted === 1) {
    this.res.end();
  }
  else {
    console.log("this is muted: " + muted);
    if(echoCoolDown > 10 && request.text === lastMessage && request.sender_type === 'user') {
      echoCoolDown = 0;
      botResponse = request.text;
      postMessage();
      this.res.end();
    } else {
      lastMessage = request.text;
    }

    if(request.text && botRegex.test(request.text)) {
      this.res.writeHead(200);
      botResponse = cool();
      postMessage();
      this.res.end();
    } else if(request.text && remindRegex.test(request.text)) {
      createReminder(request);
      postMessage();
      this.res.end();
    } else if(request.text && helpRegex.test(request.text)) {
      botResponse = "Available commands\n/cool guy - receive a face\n!remindme - not fully implemented\n!mute - silence this bot.";
      postMessage();
      this.res.end();
    } else if(request.text && muteRegex.test(request.text)) {
      botResponse = "Okay, I'll be quiet until Daddy resets me.";
      muted = 1;
      postMessage();
      this.res.end();
    } else {
      console.log("don't care");
      this.res.writeHead(200);
      this.res.end();
    }
  }
}

function createReminder(req) {
  botResponse = "Working on it.";
  var message = req.text.slice(10);
  var user = req.name;
  var info = message.split(" ");
  var value = parseInt(info[0]);
  var unit = info[1].toLowerCase();
  var reminder = message.slice(info[0].length + unit.length + 2);
  botResponse = "Okay @" + user + " I'll remind you in " + value + " " + unit + " " + reminder; 
  var multiplier = 0;

  unit = unit.replace("s","");
  switch(unit) {
    case "minute":
      multiplier = 60000;
      break;
    case "hour":
      multiplier = 3.6e+6;
      break;
    case "day":
      multiplier = 8.64e+7;
      break;
    case "week":
      multiplier = 6.048e+8;
      break;
    case "month":
      multiplier = 2.628e+9;
      break;
    case "year":
      multiplier = 3.154e+10;
      break;
    default:
      botResponse = "Bad time value, please try again."
  }

  var user_id = req.sender_id;


}

function postMessage() {
  var options, body, botReq;

  // botResponse = cool();

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}


exports.respond = respond;