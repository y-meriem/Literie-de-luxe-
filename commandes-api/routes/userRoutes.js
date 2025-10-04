const express = require('express');
const UserController = require('../controllers/userController');
const router = express.Router();

router.post('/login', UserController.login);


// CRUD Users
router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.post('/', UserController.create);
router.put('/:id', UserController.update);
router.delete('/:id', UserController.delete);


module.exports = router;
