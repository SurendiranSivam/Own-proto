const express = require('express');
const router = express.Router();
const dashboardModel = require('../models/dashboard');

router.get('/stats', async (req, res) => {
  try {
    const stats = await dashboardModel.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

router.get('/upcoming-etas', async (req, res) => {
  try {
    const etas = await dashboardModel.getUpcomingETAs();
    res.json(etas);
  } catch (error) {
    console.error('Error fetching upcoming ETAs:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming ETAs' });
  }
});

router.get('/chart-data', async (req, res) => {
  try {
    const chartData = await dashboardModel.getChartData();
    res.json(chartData);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

module.exports = router;
