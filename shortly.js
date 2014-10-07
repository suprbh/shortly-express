var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var _ = require('underscore');
var $ = require('jquery');


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
app.use(cookieParser());
//possibly add options to session.
app.use(session({secret: "This is a long string."}));

app.get('/',
function(req, res) {
  if (req.session.name){
    res.redirect('/index');
  } else {
    res.render('login');
  }
});

app.get('/login', function(req, res){
  if (req.session.name){
    res.redirect('/index');
  } else {
    res.render('login');
  }
});

app.get('/signup', function(req, res){
  res.send(util.signupPage);
});

app.get('/create',
function(req, res) {
  if (req.session.name){
    console.log("Cookie got me here:", req.session.name);
    // change to forward to the user's list of shortenedURLs
    res.render('index');
  } else {
    res.render('login');
  }
});

app.get('/links',
function(req, res) {
  // send user to login page if he tries to access all links when not logged in
  if (req.session.name){
    Links.reset().fetch().then(function(links) {
      // res.send(200, links.models);
      var $linkPage = '<h1>Shortly</h1>' +'<h2>Links Page</h2>';
      _.each(links.models, function(row){
        $linkPage += '<p><a href="'+row.url+'" >'+row.base_url+'/'+row.code+'</a></p>';
      });
      res.send(200, $linkPage);
    });
  } else {
    res.render('login');
  }
});

app.get('/index', function(req, res){
  if (req.session.name){
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/success/signup',
  function(req, res) {
      res.redirect('/login');
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){
    // console.log("Logging out user: ");
    res.send("Logged out user");
  });
  // res.render('login');
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
          console.log(newLink);
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
  //read in username, password
  var username1 = req.body.username;
  var password1 = req.body.password;

  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(password1, salt, function(err, progress){}, function(err, hash) {
        // Store hash in your password DB.
        var newUser = new User({
                username: username1,
                password: hash
              });
        newUser.save().then(function(){
          res.redirect('/login');
        });
    });
  });
});

app.post('/login', function(req, res){
  var username = req.body.username;
  var password1 = req.body.password;
  if (password1 === "" || username === ""){
    res.render('login');
  }

  db.knex('users')
    .where('username', '=', username)
    .then(function(user) {
      if (user.length > 0) {
        //if the user exists save the hash from the db
        var foundHash = user[0].password;
        bcrypt.compare(password1, foundHash, function(err, result){
          if (err) {
            throw(err);
          } else if(result){
            // found user in DB
            // console.log('cookies', req.cookies.name);
            //
            req.session.name = username;
            res.redirect('/index');
          } else if(!result){
            // Did not match password
            res.render('login');
          }
        });
      }
    });
});

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


