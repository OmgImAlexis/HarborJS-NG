const App = require('../app/models/app');

exports.create = async (req, res) => {
    let username = req.user.local.username;

    if (req.user.local.username === 'admin') {
        username = req.body.user;
    }

    await new App({
        name: `dokku/${req.body.name}:latest`,
        user: username
    }).save();

    res.redirect('/new');
};

exports.createdb = async (req, res) => {
    let username = req.user.local.username;
    if (req.user.local.username === 'admin') {
        username = req.body.user;
    }
    await new App({
        name: req.body.type + '/' + req.body.name + ':latest',
        user: username
    }).save();

    res.redirect('/new');
};

exports.destroy = async (req, res) => {
    const app = App.findById(req.params.id).exec();

    await app.remove();

    res.redirect('/dashboard');
};
