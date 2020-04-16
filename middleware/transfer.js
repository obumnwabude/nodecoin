const bcrypt = require('bcrypt');
const User = require('../models/user');

module.exports = async (req, res, next) => {
	// get user from res.locals (set in auth middleware)
	const user = res.locals.user;

	// check if a receiver phone number, amount and transaction pin are present, return if not
	if (!(req.body.phoneNumber)) 
	  return res.status(401).json({message: 'Provide a valid phoneNumber of the recipient'});
	if (!(req.body.amount))
	  return res.status(401).json({message: 'Provide the amount to be transferred'});
	if (!(req.body.transactionPin))
	  return res.status(401).json({message: 'Provide your transactionPin'});

	// check if amount is less than the sender's, return if so
	if (user.amount <= req.body.amount) 
	  return res.status(401).json({
	    message: 'The amount to be transferred is greater than the amount you have. Please provide an amount less that what you have'
	  });

	// get the recipient user with the provided phone number
	let receiverUser;
	try {
	  receiverUser = await User.findOne({phoneNumber: req.body.phoneNumber});
	} catch(error) {
	  return res.status(500).json(error);
	}

	// check if the user does not exist, return if so 
	if (!receiverUser) {
	  return res.status(401).json({message: `Recipient user with phoneNumber: ${req.body.phoneNumber} not found`});
	} else { 
	// else check the transaction pin if correct
	  bcrypt.compare(req.body.transactionPin, user.transactionPin)
	    .then(valid => { 
	      // if correct, store receiverUser and pass execution to the next function
	      if (valid) { 
	      	res.locals.receiverUser = receiverUser;
	      	next();
	      } else { 
	      // else if wrong, return
	        return res.status(401).json({message: 'Incorrect Transaction Pin, please check and try again'});
	      } 
	    }).catch(err => res.status(500).json(err));
	}
};