const express = require('express');
const router = express.Router();
const { generateMonthlyBillingCsvStream } = require('../services/reportService');

// GET /api/reports/billing?year=YYYY&month=MM
router.get('/billing', async (req, res, next) => {
    try {
        const year = parseInt(req.query.year, 10) || new Date().getFullYear();
        const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);

        const groupBy = req.query.groupBy || 'appointment';
        const filename = `facturas-${groupBy}-${year}-${String(month).padStart(2, '0')}.csv`;
        // Using semicolon-separated CSV for Excel compatibility
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Optional BOM for Excel on Windows
        res.write('\uFEFF');

        const stream = await generateMonthlyBillingCsvStream({ year, month, groupBy });
        stream.pipe(res);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
