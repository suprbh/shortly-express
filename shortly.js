var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookies = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
// app.use(express.bodyParser());
// app.use(express.cookies());
// app.use(express.session());

app.get('/',
function(req, res) {
  // if user is logged in,
    // res.render('index');
  // else, redirect to /login
  res.render('login');

});

app.get('/login', function(req, res){
  res.render('login');
});

app.get('/signup', function(req, res){
  // res.render('login');
  res.send(util.signupPage);
  // get the user name, password
});


app.get('/create',
function(req, res) {
  // if not logged in
  res.render('login');

  // res.render('index');
});

app.get('/links',
function(req, res) {
  // send user to login page if he tries to access all links when not logged in
  res.render('login');
  // else if logged in, send the links
  // Links.reset().fetch().then(function(links) {
  //   res.send(200, links.models);
  // });
});

app.get('/success/signup',
  function(req, res) {
    res.send('<h1>Successful Signup!</h1><p>Redirecting to Login page</p>');
    setTimeout(function(){
      res.render('login');
    }, 5000);
});


app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/signup', function(req, res){
  // var usr = JSON.parse(req.body);
  //read in username, password
  var username1 = req.body.username;
  var password1 = req.body.password;
  // console.log("Usr, passwd", username, password);
  // before redirect, confirm to user that they successfully signed up
  // alert(username);
  var salt1 = bcrypt.genSaltSync(10);
  var hash1 = bcrypt.hashSync(password1, salt1);
  // var userObj = db.({ username: username, password: hash, salt: salt });

  var newUser = new User({
          username: username1,
          password: hash1,
          salt: salt1
        });
  newUser.save().then(function(){
    // done();
  });

  // if(userObj){
  //     request.session.regenerate(function(){
  //         request.session.user = userObj.username;
  //         response.redirect('/restricted');
  //     });
  // }
  // else {
  //     res.redirect('login');
  // }

  // res.redirect('/success/signup');
});


// function restrict(req, res) {
//   if (req.session.user) {
//     res.render('index');
//   } else {
//     req.session.error = 'Access denied!';
//     res.redirect('/login');
//   }
// }


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);


