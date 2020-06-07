'use strict'

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const { Strategy: JwtStrategy } = require('passport-jwt')
const bcrypt = require('bcrypt')

const config = require('.') // if not specified, a require gets the file index.js in the directory
const users = require('./users')

const keys = require('./keys') //Import keys for auth APIs (Google etc)
const GoogleStrategy = require('passport-google-oauth20').Strategy //add google strategy
const FacebookStrategy = require('passport-facebook').Strategy //add facebook strategy

//Serialize User for processing them after Google oauth

passport.serializeUser((user, done) => {
  done(null, user.username)
})

passport.deserializeUser((username, done) => {
  let user = users.findByUsername(username)
  if (user = user.username) {
    done(null, user)
  }
})

//end Serialize user

passport.use(
  new GoogleStrategy({
    // options for google strategy
    clientID: keys.google.clientID,
    clientSecret: keys.google.clientSecret,
    callbackURL: '/auth/google/redirect'
  }, (accessToken, refreshToken, profile, done) => {
    // passport callback function
    console.log('passport callback function fired:')
    console.log(profile)

    const user = users.findByUsername(profile.id)
    if (user) { //if users exists already
      return done(null, user)
    } else { //if not, save user
      users.saveUser(profile.id, profile.emails[0].value, profile.displayName)
      console.log('Users: ', users.users)
      return done(null, user)
    }
  })
)

passport.use(
  new FacebookStrategy({
    //options for facebook strategy
    clientID: keys.facebook.FACEBOOK_APP_ID,
    clientSecret: keys.facebook.FACEBOOK_APP_SECRET,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'email', 'displayName']
  }, (accessToken, refreshToken, profile, done) => {
    // passport callback function
    console.log('passport callback function fired:')
    console.log(profile)

    const user = users.findByUsername(profile.id)
    if (user) { //if user exists already
      return done(null, user)
    } else { //if not, save user
      users.saveUser(profile.id, profile.emails[0].value, profile.displayName)
      console.log('Users: ', users.users)
      return done(null, user)
    }
  })
)

/*
Configure the local strategy for use by Passport.
The local strategy requires a `verify` function which receives the credentials
(`username` and `password`) submitted by the user.  The function must verify
that the username and password are correct and then invoke `done` with a user
object, which will be set at `req.user` in route handlers after authentication.
*/
passport.use('local', new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password',
    session: false // we are storing a JWT in the cookie with all the required session data. The server is session-less
  },
  function (username, password, done) {
    const user = users.findByUsername(username)
    if (user && bcrypt.compareSync(password, user.password)) {
      console.log(`username ${username}: good password!`)
      return done(null, user)
    }
    return done(null, false)
  }
))

/*
JWT strategies differ in how the token is got from the request: cookies, HTTP
authorization header, parameterize URI, ...
The first argument is the name we want for the strategy.
The second argument explains how to get the JWT from the req.
The third one is the strategy's verify function, with provides with extra
verification actions on the JWT claims (the JwtStrategy itself verifies the
signature and the expiration date). If the verification succeeds, it invokes
`done` with a user object, which will be set at `req.user` in route handlers
after authentication.
 */
passport.use('jwtCookie', new JwtStrategy(
  {
    jwtFromRequest: (req) => {
      if (req && req.cookies) { return req.cookies.jwt }
      return null
    },
    secretOrKey: config.jwt.secret
  },
  jwtVerify
))

function jwtVerify (jwtPayload, done) {
  /*
  If the user has a valid token but has been removed from our database,
  authentication fails (we return false). If the token is valid and the user
  is in the database, we return the user data (that will become available as
  req.user)
  */
  const user = users.findByUsername(jwtPayload.sub)
  // console.log(JSON.stringify(user));
  if (user) {
    console.log(`jwt for user ${jwtPayload.sub} verified and the user is in the db`)
    return done(null, user)
  }
  console.log(`jwt for user ${jwtPayload.sub} verified but the user is NOT in the db`)
  return done(null, false) //
}

module.exports = passport