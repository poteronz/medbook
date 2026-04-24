const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const { syncCompletedAppointments } = require("../utils/appointmentStatus");

const router = express.Router();

router.use(authRequired);

router.get("/", asyncHandler(async (req, res) => {
  await syncCompletedAppointments();

  const reminders = await db.allAsync(
    `SELECT a.id, a.doctor_id, a.date, a.time, a.status,
            d.name as doctor_name, d.specialty as doctor_specialty,
            d.photo as doctor_photo, d.price as doctor_price
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     WHERE a.user_id = ? AND a.status = 'upcoming'
       AND datetime(a.date || ' ' || a.time) > datetime('now', 'localtime')
     ORDER BY a.date ASC, a.time ASC`,
    [req.userId]
  );

  const now = new Date();
  const enriched = reminders.map((reminder) => {
    const target = new Date(`${reminder.date}T${reminder.time}:00`);
    const diffMs = target - now;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMinutes = Math.floor((diffMs % 3600000) / 60000);

    return {
      ...reminder,
      countdown: {
        hours: Math.max(0, diffHours),
        minutes: Math.max(0, diffMinutes),
        is_soon: diffHours < 24,
        is_urgent: diffHours < 1,
      },
    };
  });

  res.json({ reminders: enriched });
}));

module.exports = router;
