'use strict'

const express = require('express')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const passport = require('./config/passport')

const app = express()

app.use(logger('dev')) // Log requests (GET, POST, ...)
app.use(express.urlencoded({ extended: true })) // needed to retrieve html form fields
app.use(cookieParser()) // needed to retrieve cookies
app.use(passport.initialize()) // initialise the authentication middleware

/**
 * Load routes
 */
const webRoutes = require('./routes/index')
app.use('/', webRoutes)

/**
 * Create HTTPs server.
 */
const https = require('https')
const fs = require('fs')

const config = require('./config/') // if not specified, a require gets the file index.js in the directory
const credentials = {
  key: fs.readFileSync(config.tlsServer.privateKey),
  cert: fs.readFileSync(config.tlsServer.certificate)
}
var server = https.createServer(credentials, app)

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(8443)
server.on('listening', onListening)

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening () {
  const addr = server.address()
  console.log(`Listening on https://localhost:${addr.port}`)
}
