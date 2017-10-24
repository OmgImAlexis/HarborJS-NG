const LocalStrategy = require('passport-local').Strategy;
const User = require('../app/models/user');

module.exports = passport => {
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => User.findById(id, (err, user) => done(err, user)));

    passport.use('local-login', new LocalStrategy({
        // By default, local strategy uses username and password, we will override with email
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // Allows us to pass in the req from our route (lets us check if a user is logged in or not)
    }, async (req, username, password, done) => {
        process.nextTick(async () => {
            const user = await User.findOne({'local.username': username}).exec().catch(err => {
                return done(err);
            });

            // If no user is found, return the message
            if (!user) {
                return done(null, false, req.flash('loginMessage', 'No user found.'));
            }

            if (!user.validPassword(password)) {
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
            }

            // All is well, return user
            return done(null, user);
        });
    }));

    passport.use('local-signup', new LocalStrategy({
        // By default, local strategy uses username and password, we will override with email
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // Allows us to pass in the req from our route (lets us check if a user is logged in or not)
    }, (req, username, password, done) => {
        process.nextTick(async () => {
            // Check if the user is already logged-in
            if (!req.user) {
                const user = await User.findOne({'local.username': username}).exec().catch(err => {
                    return done(err);
                });

                // Check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                }

                // Create the user
                const newUser = new User({
                    local: {
                        username
                    }
                });

                await newUser.save().catch(err => {
                    return done(err);
                });

                return done(null, newUser);
            }

            const {user} = req;
            user.local.username = username;
            user.local.password = user.generateHash(password);
            user.save().catch(err => {
                return done(err);
            });

            return done(null, user);
        });
    }));
};
