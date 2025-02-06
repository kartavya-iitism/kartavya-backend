const express = require('express');
const router = express.Router();
const { checkToken, checkVerified } = require('../middleware');
const AdminController = require('../controllers/Admin');

router.get('/backup',
    checkToken,
    checkVerified,
    AdminController.backup
);

router.get('/stats',
    checkToken,
    checkVerified,
    AdminController.getStats
);

module.exports = router;