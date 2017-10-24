const http = require('http');
const path = require('path');
const express = require('express');
const logger = require('morgan');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const socketIO = require('socket.io');
const {Docker} = require('node-docker-api');

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketIO.listen(server);

const configDB = require('./config/database.js');
const credentials = require('./credentials.json');

const docker = new Docker({
    socketPath: '/var/run/docker.sock'
});

mongoose.connect(configDB.url);
mongoose.promise = global.Promise;

require('./config/passport')(passport);

app.use(logger('combined'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Required for passport
app.use(session({
    secret: 'iloveharborjsiloveharborjs',
    maxAge: new Date(Date.now() + 3600000),
    store: new MongoStore({
        url: configDB.url
    }, err => console.log(err || 'connect-mongodb setup ok'))
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // Use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport, docker); // Load our routes and pass in our app and fully configured passport

// socket function =============================================================
require('./config/sockets.js')(io, credentials, docker);

// Launch ======================================================================
server.listen(port, () => console.log('HarborJS is running on port ' + port));
