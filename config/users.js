'use strict'

const users = [
  {
    username: 'filippos',
    password: '$2b$13$ELm0Aq4eGYC/nQnTjF0ruOvOBAd4xpLb6/jJccMqNyyGVlfsuD4h2',
    email: 'mikropoulosf@gmail.com',
    name: 'Filippos Mikropoulos'
  } // password: iLikeBarcelona231!
]

const findByUsername = function (username) {
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    if (user.username === username) {
      return user
    }
  }
  return null
}

const saveUser = function (username, email, name) {
  users.push({
    'username': username,
    'email': email,
    'name': name
  })

}

module.exports = {
  users,
  findByUsername,
  saveUser
}
