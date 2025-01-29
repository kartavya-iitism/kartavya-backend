const express = require('express');
const router = express.Router();
const Contact = require('../controllers/Contact');
const catchAsync = require('../utils/catchAsync');
const { checkToken } = require("../middleware")

router.post('/submit', catchAsync(Contact.submitForm));
router.get('/all', checkToken, catchAsync(Contact.getAll));
router.delete('/bulk-delete', checkToken, catchAsync(Contact.bulkDeleteContacts));
router.post('/bulk-notify', checkToken, catchAsync(Contact.bulkNotifyContacts));

module.exports = router;