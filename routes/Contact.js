const express = require('express');
const router = express.Router();
const Contact = require('../controllers/Contact');
const catchAsync = require('../utils/catchAsync');
const { checkToken, checkVerified } = require("../middleware")

router.post('/submit', catchAsync(Contact.submitForm));
router.get('/all', checkToken, checkVerified, catchAsync(Contact.getAll));
router.delete('/bulk-delete', checkToken, checkVerified, catchAsync(Contact.bulkDeleteContacts));
router.post('/bulk-notify', checkToken, checkVerified, catchAsync(Contact.bulkNotifyContacts));
router.put('/:id/status', checkToken, checkVerified, catchAsync(Contact.updateStatus));

module.exports = router;