const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

module.exports = (passport) => {

  // ================= JWT STRATEGY (KEEP YOUR ORIGINAL) =================
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || "SECRET"
  };

  passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        const user = await User.findById(payload.id);

        if (user) return done(null, user);

        return done(null, false);

      } catch (err) {
        return done(err, false);
      }
    })
  );

