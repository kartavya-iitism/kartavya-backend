const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/user/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
            user = new User({
                username: profile.emails[0].value,
                email: profile.emails[0].value,
                name: profile.displayName,
                isVerified: true,
                profileImage: profile.photos[0].value,
                googleId: profile.id
            });
            await user.save();
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));