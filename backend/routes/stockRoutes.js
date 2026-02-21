const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockControllers');

router.post('/start-monitoring', stockController.startMonitoring);
router.get('/history', stockController.getHistory);
router.post('/refresh', stockController.refresh); 

module.exports = router;