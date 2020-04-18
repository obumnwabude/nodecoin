const router = require('express').Router();
const auth = require('../middleware/auth');
const transfer = require('../middleware/transfer');
const transactionCtrl = require('../controllers/transaction');

router.post('/transferFunds/:id', auth, transfer, transactionCtrl.transferFunds);

module.exports = router;