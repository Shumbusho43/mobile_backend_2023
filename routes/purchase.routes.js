const express = require('express');
const {
    purchaseElectricity,
    getAllTokens,
    validateToken
} = require('../controllers/purchase.controller');
const router = express.Router();
router.post('/purchase', purchaseElectricity);
router.get('/tokens', getAllTokens);
router.get('/validate/:token', validateToken)
module.exports.router = router;