const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async (req, res, next) => {
	if (!(req.params.phoneNumber))
    return res.status(400).json({message: 'Please pass a valid phoneNumber in the URL, to initiate this transfer'});

  // retrieve the user from the database 
  let sender;
  try {
    sender = await User.findOne({phoneNumber: req.params.phoneNumber});
  } catch(error) {
    return res.status(500).json(error);
  }

  // check if there's a valid user with the provided phoneNumber was not returned from the database
  if (!sender) {
    // if so return message that user with specified phoneNumber was not found
    return res.status(400).json({message: `User with phoneNumber: ${req.params.phoneNumber}, not found!`});
  }

	// check if a receiver phone number, amount and transaction pin are present, return if not
	if (!(req.body.phoneNumber)) 
	  return res.status(401).json({message: 'Provide a valid phoneNumber of the recipient, in the request body'});
	if (!(req.body.amount))
	  return res.status(401).json({message: 'Provide the amount to be transferred, in the request body'});
	else if (isNaN(req.body.amount))
		return res.status(401).json({message: 'Please provide a valid amount, in the request body'});
	if (!(req.body.transactionPin))
	  return res.status(401).json({message: 'Provide your transactionPin, in the request body'});

	// check if amount is less than the sender's, return if so
	if (sender.amount <= req.body.amount) 
	  return res.status(401).json({
	    message: 'The amount to be transferred is greater than the amount you have. Please provide an amount less that what you have'
	  });

	// ensure that senders cannot send to themselves
	if (sender.phoneNumber == req.body.phoneNumber) 
	  return res.status(401).json({message: 'You cannot send money to yourself'});

	// get the recipient user with the provided phone number
	let receiver;
	try {
	  receiver = await User.findOne({phoneNumber: req.body.phoneNumber});
	} catch(error) {
	  return res.status(500).json(error);
	}

	// check if the user does not exist, return if so 
	if (!receiver) {
	  return res.status(401).json({message: `Recipient user with phoneNumber: ${req.body.phoneNumber} not found`});
	} else { 
    // if there's a user, check the authorization for token matching
    try {
      // get the token from request headers
      const token = req.headers.authorization.split(' ')[1];
      const decodedToken = jwt.verify(token, 'RandoM_SECreT');
      if (decodedToken.email === sender.email) {
        // check the transaction pin if correct
        bcrypt.compare(req.body.transactionPin, sender.transactionPin)
          .then(valid => { 
            // if correct, store sender and receiver in res.locals and pass execution to the next function
            if (valid) { 
              res.locals.sender = sender;
              res.locals.receiver = receiver;
              next();
            } else { 
            // else if wrong, return
              return res.status(401).json({message: 'Incorrect Transaction Pin, please check and try again'});
            } 
          }).catch(err => res.status(500).json(err));
      } else {
        console.log('entered else')
        throw new Error('Invalid Request');
      }
    } catch(error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({
          message: 'Session expired, please login again'
        });
      } else {
        return res.status(400).json({message: 'Invalid Request'});
      }
    }
		
	}
};