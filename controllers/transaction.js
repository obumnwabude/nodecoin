const User = require('../models/user');
const dateTime = require('../date-time');

exports.transferFunds = (req, res, next) => {
  // get sender and receiver from res.locals
  const sender = res.locals.sender;
  const receiver = res.locals.receiver;

  // CARRY OUT THE TRANSFER
  // debit the sender 
  sender.amount = sender.amount - Number(req.body.amount);
  // credit the receiver
  receiver.amount = receiver.amount + Number(req.body.amount);

  // CREATE TRANSFER DETAILS 
  // create detail for sender
  const senderDetail = `DEBIT senderPhoneNumber(me):${sender.phoneNumber} ` + 
    `receiverPhoneNumber:${receiver.phoneNumber} amount:${Number(req.body.amount)} ` + 
    `date:${dateTime.getDate()} time:${dateTime.getTime()}`;
  // add to its transactionLogs
  sender.transactionLogs.push(senderDetail);
  // create detail for receiver
  const receiverDetail = `CREDIT senderPhoneNumber:${sender.phoneNumber} ` + 
    `receiverPhoneNumber(me):${receiver.phoneNumber} amount:${Number(req.body.amount)} ` + 
    `date:${dateTime.getDate()} time:${dateTime.getTime()}`;
  // add to its transactionLogs
  receiver.transactionLogs.push(receiverDetail);

  // save sender and receiver changes and return
  sender.save().then(updatedSender => {
    receiver.save().then(updatedReceiver => {
      // return
      return res.status(201).json({
        message: 'Transfer Successful',
        amount: Number(req.body.amount),
        senderPhoneNumber: updatedSender.phoneNumber,
        receiverPhoneNumber: updatedReceiver.phoneNumber
      });
    }).catch(err => res.status(500).json({
      message: 'Error occured at saving sender',
      error: err
    }));
  }).catch(err => res.status(500).json({
    message: 'Error occured at saving receiver',
    error: err
  }));
};