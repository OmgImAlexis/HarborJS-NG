var config = require('../config/application.js');
var App    = require('../app/models/apps');
module.exports = function(app, passport, docker) {

// normal routes ===============================================================

  // show the home page
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  // PROFILE SECTION =========================
  app.get('/profile', isLoggedIn, function(req, res) {
    res.render('profile.ejs', {
      user : req.user
    });
  });

  app.get('/dashboard', isLoggedIn,  function (req,res) {
	docker.listContainers(function(err,cont){
     App.find(function (warn, apps, count){
        if(!apps) apps = [];
        if(!cont) cont = [];

       res.render('dashboard.ejs',{apps: apps, containers: cont, user : req.user});
    });
   });
  });

  app.get('/ssh', isLoggedIn ,function (req,res) {
    res.render('ssh.ejs');
  });

  app.get('/containers/:id', isLoggedIn,function(req,res){
    console.log('INSPECT CONTAINER WITH ID '+req.params.id);
    var container = docker.getContainer(req.params.id);
    container.inspect(req.params.id,function(err,requ){
      if (err) throw err;
      var reqname = requ.Config.Image;
      container.attach({stream: true, stdout: true, stderr:false, tty:false}, function(err,stream) {
	res.render('containers/show.ejs',{container: requ, name: reqname, stream: stream});
      });
    });
  });


  // LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

// app routes ===============================================================
  app.get('/new', isLoggedIn, function(req,res){
   res.render('containers/new.ejs' ,{user : req.user});
  });

  app.post('/create', config.create);

  app.post('/createdb', config.createdb);

  app.get('/destroy/:id', config.destroy);

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

  // locally --------------------------------
    // LOGIN ===============================
    // show the login form
    app.get('/login', function(req, res) {
      res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/profile', // redirect to the secure profile section
      failureRedirect : '/login', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function(req, res) {
      res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/profile', // redirect to the secure profile section
      failureRedirect : '/signup', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
    }));



  // locally --------------------------------
    app.get('/connect/local', function(req, res) {
      res.render('connect-local.ejs', { message: req.flash('loginMessage') });
    });
    app.post('/connect/local', passport.authenticate('local-signup', {
      successRedirect : '/profile', // redirect to the secure profile section
      failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
    }));

  // unlink -----------------------------------
  app.get('/unlink/local', function(req, res) {
    var user            = req.user;
    user.local.username    = undefined;
    user.local.password = undefined;
    user.save(function(err) {
      res.redirect('/');
    });
  });
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {

  if (req.user){
    return next();
  }
  res.redirect('/');
}

