const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

mongoose.promise = global.Promise;

const User = new mongoose.Schema({
    local: {
        username: String,
        password: String
    }
});

User.pre('save', function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    this.password = bcrypt.hashSync(this.local.password, 8);

    next();
});

User.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', User);
