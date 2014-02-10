/*
 * Rushed ugly code by <thomasalwyndavis@gmail.com>
 */

var cors = require('cors');
var express = require('express');
var fs = require('fs');
var mailgun = require('mailgun-js')(process.env.MAILGUN_API_KEY,
                                    process.env.MAILGUN_DOMAIN);
var MongoClient = require('mongodb').MongoClient;
var Mustache = require('mustache');

var PORT = process.env.PORT || 8080;

// XXX: Add to environment variables?
var whitelist = [
  'http://dev.stopwatching.us',
  'http://rally.stopwatching.us',
  'http://2.stopwatching.us',
  'http://localhost:4000',
  'https://dev.stopwatching.us',
  'https://rally.stopwatching.us',
  'https://2.stopwatching.us',
  'https://localhost:4000',
  'https://thedaywefightback.org',
  'http://thedaywefightback.org',
  'https://thedaywefightback.org/',
  'http://thedaywefightback.org/',
  'http://dznh7un1y2etk.cloudfront.net',
  'http://tfrce.github.io'
];

var corsOptions = {
  origin: function (origin, cb) {
    cb(null, whitelist.indexOf(origin) !== -1);
  }
};

var emails, signatures;

var domesticTemplate = fs.readFileSync('templates/domestic.html', 'utf8');
var internationalTemplate = fs.readFileSync('templates/international.html', 'utf8');

var app = express();

app.use(express.urlencoded());
app.use(express.json());

app.use('/xdm', express.static(__dirname + '/xdm'));

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.get('/count', function (req, res) {
  res.setHeader("Expires", new Date(Date.now() + 1 * 60 * 1000).toUTCString());

  emails.count(function (err, count) {
    res.jsonp({ count: count });
  });
});

app.get('/', function (req, res) {
  res.jsonp({
    message: 'Welcome to email congress, also doubles up as a time server'
  });
});

app.get('/time', function (req, res) {
  res.setHeader("Expires", new Date(Date.now() + 1 * 60 * 1000).toUTCString());

  var targetTime = new Date(Date.now());
  var timeZoneFromDB = -5.00; //time zone value from database

  //get the timezone offset from local time in minutes
  var tzDifference = timeZoneFromDB * 60;

  //convert the offset to milliseconds, add to targetTime, and make a new Date
  var offsetTime = new Date(targetTime.getTime() + tzDifference * 60 * 1000);
  var days = 11 - offsetTime.getDate();

  res.jsonp({
    days: days,
    thedaywefightback: offsetTime.getDate() === 11 ? true: false,
    est: offsetTime,
    utc: new Date(Date.now())
  });
});

app.post('/email', function (req, res) {
  var email = {
    email: req.body.email,
    name: req.body.name,
    address: req.body.address,
    org: req.body.org,
    message: req.body.message,
    zip: req.body.zip
  };

  emails.insert(email, function (err) {
    if (err) {
      return res.jsonp({error: err});
    }

    res.jsonp({message: 'Email added'});
  });
});

app.get('/signature_count', function (req, res) {
  res.setHeader("Expires", new Date(Date.now() + 1 * 60 * 1000).toUTCString());

  signatures.count(function (err, count) {
    if (err) {
      return res.jsonp({error: err});
    }

    res.jsonp({count: count});
  });
});

app.post('/signature', function (req, res) {
  var email = {
    email: req.body.email,
    name: req.body.name,
    org: req.body.org,
    country: req.body.country
  };

  signatures.insert(email, function (err) {
    if (err) {
      return res.jsonp({error: err});
    }

    res.jsonp({message: 'Email added'});
  });
});

MongoClient.connect(process.env.MONGOHQ_URL, function (err, db) {
  if (err) {
    throw err;
  }

  emails = db.collection('emails');
  signatures = db.collection('signatures');

  app.listen(PORT, function () {
    console.log('listening at %d', PORT);
  });
});
