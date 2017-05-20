// load up the user model
var App       = require('../app/models/apps');

exports.create = function(req, res){
  var username = req.user.local.username;
  if(req.user.local.username == "admin") {
    username = req.body.user;
  }
  new App({
    name : 'dokku/'+req.body.name+':latest',
    user : username
  }).save(function(err, app, count){
    res.redirect('/new');
  });
};

exports.createdb = function(req,res){
  var username = req.user.local.username;
  if(req.user.local.username == "admin") {
    username = req.body.user;
  }
  new App({
    name : req.body.type + '/'  + req.body.name + ':latest',
    user : username
  }).save(function(err, app, count){
    res.redirect('/new');
  });
};

exports.destroy = function(req, res){
  App.findById( req.params.id, function(err, app){
    app.remove(function(err, app){
      res.redirect('/dashboard');
    });
  })
};

/*exports.show = function(req,res){
  App.find( function(err, apps, count){

};*/

