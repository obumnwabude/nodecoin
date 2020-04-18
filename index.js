const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const Logger = require('./models/logger');
const indexRoutes = require('./routes/index');
const userRoutes = require('./routes/user');
const transactionRoutes = require('./routes/transaction');
const port = process.env.PORT || 3000;

// connect to mongodb
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecxbackend-nodecoin', 
  {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => {
    console.log('Successfully connected to MongoDB!');
  })
  .catch((error) => {
    console.log('Unable to connect to MongoDB!');
    console.error(error);
  });

// for receiving post data
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// the logger
const logStream = { 
  write: line => {
    const logger = new Logger({log: line});
    logger.save().catch(err => console.log(err));
  }
};

// morgan middleware for logging
app.use(morgan(':method :url :status :response-time ms', {stream: logStream}));

app.use('/', indexRoutes);
app.use('/', userRoutes);
app.use('/', transactionRoutes);

module.exports = app.listen(port);