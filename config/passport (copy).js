'use strict'

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const { Strategy: JwtStrategy } = require('passport-jwt')
const bcrypt = require('bcrypt')

const config = require('.') // if not specified, a require gets the file index.js in the directory
const users = require('./users')

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
