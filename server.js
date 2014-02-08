/*
Rushed ugly code by <thomasalwyndavis@gmail.com>

Will clean up and make available

*/
var MongoClient = require('mongodb').MongoClient,
    format = require('util').format;



var express = require('express');
var port = process.env.PORT || 8080;
var allowCrossDomain = function(req, res, next) {
    var allowedHost = [
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
    if (allowedHost.indexOf(req.headers.referer) !== -1 || allowedHost.indexOf(req.headers.origin) !== -1) {
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Origin', req.headers.origin)
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
        next();
    } else {
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

        next();
    }
}
MongoClient.connect(process.env.MONGOHQ_URL, function(err, db) {
    if (err) throw err;

    var collection = db.collection('emails');
    var signatures = db.collection('signatures');
    var server = express();
    server.use(express.bodyParser());
    server.use(allowCrossDomain);
    server.use('/xdm', express.static(__dirname + '/xdm'));
    server.options("*", function(req, res, next) {
        res.send({});
    });


    server.get('/count', function(req, res, next) {
      res.setHeader("Expires", new Date(Date.now() + 1 * 60 * 1000).toUTCString());
      collection.count(function(err, count) {
        res.jsonp({count: count});
      })
    });
    server.get('/', function(req, res, next) {
        res.jsonp({message: 'Welcome to email congress, also doubles up as a time server'}); // Do something with your data!
    });


    server.get('/time', function(req, res, next) {
        res.setHeader("Expires", new Date(Date.now() + 1 * 60 * 1000).toUTCString());
        var targetTime = new Date(Date.now());
        var timeZoneFromDB = -5.00; //time zone value from database
        //get the timezone offset from local time in minutes
        var tzDifference = timeZoneFromDB * 60;
        //convert the offset to milliseconds, add to targetTime, and make a new Date
        var offsetTime = new Date(targetTime.getTime() + tzDifference * 60 * 1000);
        var days = 11 - offsetTime.getDate();
        res.jsonp({days: days, thedaywefightback: offsetTime.getDate() === 11 ? true: false, est: offsetTime, utc: new Date(Date.now())}); // Do something with your data!
    });



    server.post('/email', function(req, res, next) {
        var email = {
          email: req.body.email,
          name: req.body.name,
          address: req.body.address,
          org: req.body.org,
          message: req.body.message,
          zip: req.body.zip
        }
        console.log(email);
        collection.insert(email, function(err, docs) {
          res.jsonp({message: 'Email added'}); // Do something with your data!
        });


    });
    server.get('/signature_count', function(req, res, next) {
      res.setHeader("Expires", new Date(Date.now() + 1 * 60 * 1000).toUTCString());
      signatures.count(function(err, count) {
        res.jsonp({count: count});
      })
    });
    server.post('/signature', function(req, res, next) {
        var email = {
          email: req.body.email,
          name: req.body.name,
	  org: req.body.org,
          country: req.body.country
        }
        signatures.insert(email, function(err, docs) {
          res.jsonp({message: 'Email added'}); // Do something with your data!
        });


    });




    server.listen(port, function() {
        console.log('%s listening at %s', server.name, server.url);
    });

})
