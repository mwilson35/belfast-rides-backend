const express = require('express');
const router = express.Router();
const db = require('../db'); // ✅ this one is enough

// POST /api/slots
router.post("/", async (req, res) => {
  const { driverId, date, startTime, endTime } = req.body;

  if (!driverId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await db.query(
      `INSERT INTO available_slots 
       (driver_id, date, start_time, end_time) 
       VALUES (?, ?, ?, ?)`,
      [driverId, date, startTime, endTime]
    );
    res.status(201).json({ message: "Slot added" });
  } catch (err) {
    console.error("Error adding slot:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/slots/available?date=YYYY-MM-DD
router.get('/available', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Missing date parameter' });
  }

  try {
    const [slots] = await db.query(
      `SELECT id AS slotId, driver_id AS driverId, start_time AS startTime, end_time AS endTime 
       FROM available_slots 
       WHERE date = ? AND is_booked = false`,
      [date]
    );

    res.json(slots);
  } catch (err) {
    console.error('Error fetching available slots:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
