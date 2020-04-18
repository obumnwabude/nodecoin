const router = require('express').Router();
const auth = require('../middleware/auth');
const userCtrl = require('../controllers/user');

router.get('/getUser/:id', auth, userCtrl.getUser);
router.get('/getUserTransactions/:id', auth, userCtrl.getUserTransactions);
router.post('/createUser', userCtrl.createUser);
router.post('/loginUser', userCtrl.loginUser);
router.put('/updateUser/:id', auth, userCtrl.updateUser);
router.delete('/deleteUser/:id', auth, userCtrl.deleteUser);

module.exports = router;