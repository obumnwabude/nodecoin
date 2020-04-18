const router = require('express').Router();
const indexCtrl = require('../controllers/index');

router.get('/', indexCtrl.getAllUsers);
router.get('/logs', indexCtrl.getLogs);

module.exports = router;