const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Call this with the passport instance from server.js
module.exports = (passport) => {
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL,
                scope: ['user:email'],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Grab primary email from GitHub profile
                    const email =
                        (profile.emails && profile.emails.find(e => e.primary)?.value) ||
                        (profile.emails && profile.emails[0]?.value) ||
                        null;

                    // Already logged in with GitHub before
                    let user = await User.findOne({ githubId: profile.id });
                    if (user) return done(null, user);

                    // Link to existing local account if same email
                    if (email) {
                        user = await User.findOne({ email });
                        if (user) {
                            user.githubId = profile.id;
                            if (!user.displayName) {
                                user.displayName = profile.displayName || profile.username;
                            }
                            await user.save();
                            return done(null, user);
                        }
                    }

                    // Brand new user
                    const newUser = await User.create({
                        githubId: profile.id,
                        email: email || `github_${profile.id}@placeholder.com`,
                        displayName: profile.displayName || profile.username,
                    });

                    return done(null, newUser);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    // Required by Passport even with JWT — store/retrieve by user ID
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};
