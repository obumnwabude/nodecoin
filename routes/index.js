const router = require('express').Router();
const User = require('../models/user');
const Logger = require('../models/logger');

router.get('/', (req, res, next) => {
  // get and return all users from database
  User.find({}).then(users => {
    users = users.map(user => {
      return {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber
      };
    });
    res.status(200).json({users: users});
  }).catch(err => res.status(500).json(err));
});

router.get('/logs', (req, res, next) => {
  Logger.find({}).then(logs => {
    res.format({
      'text/plain': () => res.status(200).send(logs.map(log => log.log).join(''))
    });
  }).catch(err => res.status(500).json(err));
});

module.exports = router;