const Debug = require('debug');
const config = require('../config/application');
const App = require('../app/models/app');

const debug = new Debug('harbor');

// Route middleware to ensure user is logged in
const isLoggedIn = ({user}, res, next) => {
    if (user) {
        return next();
    }
    return res.redirect('/');
};

module.exports = (app, passport, docker) => {
    app.get('/', (req, res) => res.render('index.ejs'));
    app.get('/profile', isLoggedIn, ({user}, res) => res.render('profile.ejs', {user}));

    app.get('/dashboard', isLoggedIn, async ({user}, res) => {
        const containers = await docker.container.list().then(containers => containers.map(container => container.data));
        const apps = await App.find().exec();
        res.render('dashboard.ejs', {apps, containers, user});
    });

    app.get('/ssh', isLoggedIn, (req, res) => res.render('ssh.ejs'));

    app.get('/containers/:id', isLoggedIn, async (req, res) => {
        debug(`Inspecting container [${req.params.id}]`);
        const container = docker.container.get(req.params.id);
        const {data} = await container.status();
        const name = data.Config.Image;
        container.logs({stream: true, stdout: true, stderr: false, tty: false}).then(stream => {
            res.render('containers/show.ejs', {container: data, name, stream});
        });
    });

    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    app.get('/new', isLoggedIn, ({user}, res) => res.render('containers/new.ejs', {user}));

    app.get('/api/app_name_exists/:name', isLoggedIn, async (req, res) => {
        const name = `dokku/${decodeURIComponent(req.params.name)}:latest`;
        const app = await App.findOne({name}).exec();

        return res.json(Boolean(app));
    });

    app.post('/create', config.create);

    app.post('/createdb', config.createdb);

    app.get('/destroy/:id', config.destroy);

    app.get('/login', (req, res) => res.render('login.ejs', {message: req.flash('loginMessage')}));

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // Redirect to the secure profile section
        failureRedirect: '/login', // Redirect back to the signup page if there is an error
        failureFlash: true // Allow flash messages
    }));

    app.get('/signup', (req, res) => res.render('signup.ejs', {message: req.flash('signupMessage')}));

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // Redirect to the secure profile section
        failureRedirect: '/signup', // Redirect back to the signup page if there is an error
        failureFlash: true // Allow flash messages
    }));

    app.get('/connect/local', (req, res) => res.render('connect-local.ejs', {message: req.flash('loginMessage')}));

    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/profile', // Redirect to the secure profile section
        failureRedirect: '/connect/local', // Redirect back to the signup page if there is an error
        failureFlash: true // Allow flash messages
    }));

    // Unlink -----------------------------------
    app.get('/unlink/local', async ({user}, res) => {
        user.local.username = undefined;
        user.local.password = undefined;

        await user.save();

        return res.redirect('/');
    });
};
