const express = require('express');
const router = express.Router();

// db connection should already be required somewhere globally
const db = require('../db'); // or wherever your DB is connected

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

module.exports = router;
