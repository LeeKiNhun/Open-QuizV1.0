const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const User = require("../models/User");

function normalizeEmail(email) {
  return (email || "").toLowerCase().trim();
}

module.exports = function initPassport() {
  // GOOGLE
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = normalizeEmail(profile.emails?.[0]?.value);
          const googleId = profile.id;

          let user = await User.findOne({
            $or: [{ maGoogle: googleId }, ...(email ? [{ email }] : [])],
          });

          if (!user) {
            user = await User.create({
              hoTen: profile.displayName || "Người dùng",
              email: email || `google_${googleId}@openquiz.local`,
              maGoogle: googleId,
              vaiTro: "student",
              trangThai: "active",
            });
          } else {
            if (!user.maGoogle) user.maGoogle = googleId;
            if (!user.email && email) user.email = email;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // MICROSOFT
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: process.env.MICROSOFT_CALLBACK_URL,
        scope: ["user.read"],
        tenant: "common",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email =
            normalizeEmail(profile._json?.mail) ||
            normalizeEmail(profile._json?.userPrincipalName);
          const msId = profile.id;

          let user = await User.findOne({
            $or: [{ maMicrosoft: msId }, ...(email ? [{ email }] : [])],
          });

          if (!user) {
            user = await User.create({
              hoTen: profile.displayName || "Người dùng",
              email: email || `ms_${msId}@openquiz.local`,
              maMicrosoft: msId,
              vaiTro: "student",
              trangThai: "active",
            });
          } else {
            if (!user.maMicrosoft) user.maMicrosoft = msId;
            if (!user.email && email) user.email = email;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};