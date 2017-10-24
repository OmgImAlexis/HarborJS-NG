const mongoose = require('mongoose');

mongoose.promise = global.Promise;

const App = new mongoose.Schema({
    name: String,
    user: String
});

module.exports = mongoose.model('App', App);

