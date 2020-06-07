'use strict'

const express = require('express')
const passport = require('../config/passport')
const jwt = require('jsonwebtoken')
const fortune = require('fortune-teller')
const path = require('path')

const config = require('../config')

const router = express.Router()

router.get('/', (req, res) => {
  res.send(`
        <h1>Welcome to the fortune-teller server!</h1>
        <p>Do you want to get advice from <a href="./fortune">the fortune-teller server</a>?</p>
    `)
})

router.get('/fortune', passport.authenticate('jwtCookie', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const userToken = jwt.decode(req.cookies.jwt)
    res.send(`<h1>Welcome, ${userToken.name}!</h1>
            <p>The fortune-teller server says:</p>
            <pre>${fortune.fortune()}</pre>
            <p></p>
            <p>Your <strong>JWT</strong> is: </p>
            <pre>${req.cookies.jwt}</pre>
            <p>Your <strong>JWT decoded payload</strong> is: </p>
            <pre>${JSON.stringify(userToken)}</pre>
            <p>Please <a href="./logout">logout</a> if you are not interested in more wise advice</p>`)
  }
)

router.get('/logout', (req, res) => {
  res.clearCookie('jwt')
  res.redirect('/')
})

router.get('/login',
  (request, response) => {
    response.sendFile('/views/login.html', { root: path.join(__dirname, '..') })
  })

router.post('/auth/local/login', passport.authenticate('local', { session: false, failureRedirect: '/login' }),
  function (req, res) {
    const token = _createJwt(req.user)
    /** assign our jwt to the cookie */
    res.cookie('jwt', token, config.cookieOptions)
    /** Report success and allow the user to visit the intranet */
    res.send(`
<h3>Login succeeded!</h3>
<p>Now you have a valid JWT that can be used to access the fortune-teller server.</p>
<p>If you check your cookies, you will see that you have one called jwt with your JWT</p>
<p>Your <strong>JWT</strong> is:</p>
<a href="https://jwt.io/?token=${token}" target="_blank"><pre>${token}</pre></a>
<p>Please proceed to the <a href="../../fortune">fortune-teller server</a></p>`)
  }
)

//AUTH WITH GOOGLE
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}))

//callback route for google to redirect to
router.get('/auth/google/redirect', passport.authenticate('google'), (req, res) => {
    const token = _createJwt(req.user)
    /** assign our jwt to the cookie */
    res.cookie('jwt', token, config.cookieOptions)
    /** Report success and allow the user to visit the intranet */
    res.send(`
<h3>Login succeeded with Google passport Strategy!</h3>
<p>Now you have a valid JWT that can be used to access the fortune-teller server.</p>
<p>If you check your cookies, you will see that you have one called jwt with your JWT</p>
<p>Your <strong>JWT</strong> is:</p>
<a href="https://jwt.io/?token=${token}" target="_blank"><pre>${token}</pre></a>
<p>Please proceed to the <a href="../../fortune">fortune-teller server</a></p>`)
  }
)

//end AUTH LOGIN WITH GOOGLE

function _createJwt (user) {
  /** This is what ends up in our JWT */
  const jwtClaims = {
    sub: user.username,
    iss: config.baseUrl,
    aud: config.baseUrl,
    exp: Math.floor(Date.now() / 1000) + 604800, // 1 weak (7×24×60×60=604800s) from now
    name: user.name,
    email: user.email
  }

  /** generate a signed json web token and return it in the response */
  return jwt.sign(jwtClaims, config.jwt.secret)
}

module.exports = router
