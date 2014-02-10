var fs = require('fs');
var mailgun = require('mailgun-js')(process.env.MAILGUN_API_KEY,
                                    process.env.MAILGUN_DOMAIN);
var Mustache = require('mustache');

var templates = {
  domestic: fs.readFileSync('templates/domestic.html', 'utf8'),
  international: fs.readFileSync('templates/international.html', 'utf8')
};

exports.send = function (template, address, details, cb) {
  var data = {
    from: 'The Day We Fight Back <contact@thedaywefightback.org>',
    to: address,
    subject: 'XXX decide on a subject',
    html: Mustache.render(templates[template], details)
  };

  mailgun.messages.send(data, function (err, response, body) {
    cb(err, response, body);
  });
};
