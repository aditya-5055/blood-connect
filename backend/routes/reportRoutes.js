const express = require("express");
const router = express.Router();
const { 
    getCampReport, 
    getProactiveReport, 
    getInventoryTransactionReport 
} = require("../controllers/reportController"); // The file we discussed earlier

const { auth, isBloodBank } = require("../middleware/authMiddleware");

// All reporting routes are protected for Blood Bank admins only
router.get("/camps", auth, isBloodBank, getCampReport);
router.get("/proactive", auth, isBloodBank, getProactiveReport);
router.get("/inventory", auth, isBloodBank, getInventoryTransactionReport);

module.exports = router;