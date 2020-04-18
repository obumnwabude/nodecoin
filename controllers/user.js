const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.getUser = (req, res, next) => {
  // get user from res.locals (set in auth middleware)
  const user = res.locals.user;

  // return user info
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    amount: user.amount,
    transactionLogs: user.transactionLogs
  });
};

exports.getUserTransactions = (req, res, next) => {
  // get the user from the res.locals (set in auth middleware)
  const user = res.locals.user;
  // return the transactionLogs in order of most recent transaction
  res.format({
    'text/plain': () => res.status(200).send(user.transactionLogs.reverse().join('\n'))
  });
};

exports.createUser = (req, res, next) => {
  // ensures that name, email, phoneNumber, password, amount and transactionPin are provided 
  if (!(req.body.name)) 
    return res.status(401).json({message: 'Please provide a valid name'});
  else if (!(req.body.email))
    return res.status(401).json({message: 'Please provide a valid email'});
  else if (!(req.body.phoneNumber))
    return res.status(401).json({message: 'Please provide a valid phoneNumber'});
  else if (!(req.body.password))
    return res.status(401).json({message: 'Please provide a password'});
  else if (!(req.body.amount))
    return res.status(401).json({message: 'Please provide an amount'});
  else if (!(req.body.amount) < 0 || isNaN(req.body.amount))
    return res.status(401).json({message: 'Please provide a valid amount'});
  else if (!(req.body.transactionPin))
    return res.status(401).json({message: 'Please provide a transactionPin'});

  // hash the password from req.body 
  bcrypt.hash(req.body.password, 10)
    .then(hashedPassword => {
      bcrypt.hash(req.body.transactionPin, 10)
        .then(hashedTransactionPin => { 
          // create a new user
          const user = new User({
            name: req.body.name,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            password: hashedPassword,
            amount: req.body.amount,
            transactionLogs: req.body.transactionLogs || [],
            transactionPin: hashedTransactionPin
          });
          // save and return the user
          user.save()
            .then(() => res.status(201).json({
              message: 'User successfully created!',
              _id: user._id,
              name: user.name,
              email: user.email,
              phoneNumber: user.phoneNumber,
              amount: user.amount
            }))
            .catch(err => {
              // check if email or phoneNumber are not unique and return proper message
              if (err.name === 'ValidationError') {
                let messages = [];
                for (let [key, value] of Object.entries(err.errors)) {
                  messages.push(`User with ${key}: ${value.value} exists already`);
                }
                const returnMessage = messages.join('\n').concat('.');
                return res.status(401).json({message: returnMessage});
              }
              res.status(500).json(err);
            }); 
        }).catch(err => res.status(500).json(err));
    }).catch(err => res.status(500).json(err));
};

exports.loginUser = async (req, res, next) => {
  // lookup the user with email or phoneNumber provided from the database
  let user;
  if (req.body.email || req.body.phoneNumber) {
    try {
      if (req.body.email) {
        user = await User.findOne({email: req.body.email});
      } else if (req.body.phoneNumber) {
        user = await User.findOne({phoneNumber: req.body.phoneNumber});
      }
    } catch(error) {
      return res.status(401).json(error);
    }
  } else {
    // return message if no email or phoneNumber is passed to the body
    return res.status(401).json({message: 'Please provide a valid email or phoneNumber to login.'});
  }

  // if a user was not found return the message that user was not found
  if (!user) return res.status(401).json({
    message: `User${req.body.email ? ' with email: ' + req.body.email : req.body.phoneNumber ? 
      ' with phoneNumber: ' + req.body.phoneNumber : '' } not found, please provide correct login details or sign up.`
  });

  // ensures that a password was passed
  if (!(req.body.password))
    return res.status(401).json({message: 'Please provide a password'});

  // check if passwords match
  bcrypt.compare(req.body.password, user.password)
    .then(valid => {
    // if passwords match return succesful login message with token
    if (valid) {
      // token signing
      const token = jwt.sign({email: user.email}, 'RandoM_SECreT', {expiresIn: '1h'});
      return res.status(201).json({
        message: 'Login successful!',
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        amount: user.amount,
        token: token
      });
    } else { 
     // else return message of wrong password
      return res.status(401).json({message: 'Wrong password, please login with correct password.'});
    }
  }).catch(err => res.status(500).json(err));
}

exports.updateUser = async(req, res, next) => {
  // get user from res.locals (set in auth middleware)
  const user = res.locals.user;

  // if there's a user, check if the body has valid data to update with 
  if (!(req.body.name || req.body.email || req.body.phoneNumber 
    || req.body.password || req.body.amount || req.body.transactionPin)) { 
    return res.status(401).json({
      message: 'Please provide valid name, email, phoneNumber, password, amount or transactionPin to update with'
    });
  }

  // check if any amount passed is less than zero return if so
  if (req.body.amount && (req.body.amount < 0 || isNaN(req.body.amount))) {
    return res.status(401).json({
      message: 'Please provide a valid amount'
    });
  }
    
  // update with the provided body data
  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
  if (req.body.password) {
    try {
      user.password = await bcrypt.hash(req.body.password, 10);
    } catch(error) {
      res.status(500).json(error);
    }
  }
  if (req.body.amount) user.amount = req.body.amount;
  if (req.body.transactionPin) {
    try {
      user.transactionPin = await bcrypt.hash(req.body.transactionPin, 10);
    } catch(error) {
      res.status(500).json(error);
    }
  }
  user.save().then(updated => {
    res.status(201).json({
      message: 'Update Successful',
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phoneNumber: updated.phoneNumber,
      amount: updated.amount
    });
  }).catch(err => {
    // check if email or phoneNumber are not unique and return proper message
    if (err.name === 'ValidationError') {
      let messages = [];
      for (let [key, value] of Object.entries(err.errors)) {
        messages.push(`User with ${key}: ${value.value} exists already. Please use a different ${key}`);
      }
      const returnMessage = messages.join('\n').concat('.');
      return res.status(401).json({message: returnMessage});
    }
    res.status(500).json(err)
  });
};

exports.deleteUser = (req, res, next) => {
  // get user from res.locals (set in auth middleware)
  const user = res.locals.user;

  // delete the user  
  User.deleteOne({_id: user._id})
    // return message saying user deleted
    .then(() => res.status(200).json({
      message: `Successfully Deleted user with _id: ${user._id}`
    }))
    .catch(err => res.status(500).json(err));
};