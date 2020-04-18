const router = require('express').Router();
const transfer = require('../middleware/transfer');
const transactionCtrl = require('../controllers/transaction');

router.post('/transferFunds/:phoneNumber', transfer, transactionCtrl.transferFunds);

module.exports = router;