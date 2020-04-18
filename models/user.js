const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const logSchema = new mongoose.Schema({
  type: String,
  amount: Number, 
  sender: String, 
  receiver: String, 
  date: String, 
  time: String 
});

module.exports = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  transactionLogs: [logSchema],
  transactionPin: { type: String, required: true}
}).plugin(uniqueValidator));
