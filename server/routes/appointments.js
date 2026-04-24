const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { appointmentRules, handleValidation } = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");
const { syncCompletedAppointments } = require("../utils/appointmentStatus");

const router = express.Router();

router.use(authRequired);

router.post("/", appointmentRules, handleValidation, asyncHandler(async (req, res) => {
  const { doctor_id, slot_id } = req.body;
  const userId = req.userId;
  let transactionStarted = false;

  try {
    await db.execAsync("BEGIN IMMEDIATE TRANSACTION");
    transactionStarted = true;

    const slot = await db.getAsync(
      "SELECT * FROM slots WHERE id = ? AND doctor_id = ?",
      [slot_id, doctor_id]
    );
    if (!slot) {
      await db.execAsync("ROLLBACK");
      transactionStarted = false;
      return res.status(404).json({ error: "Слот не найден" });
    }

    const slotDateTime = new Date(`${slot.date}T${slot.time}:00`);
    if (Number.isNaN(slotDateTime.getTime()) || slotDateTime <= new Date()) {
      await db.execAsync("ROLLBACK");
      transactionStarted = false;
      return res.status(400).json({ error: "Нельзя записаться на прошедший слот" });
    }

    const conflict = await db.getAsync(
      "SELECT id FROM appointments WHERE user_id = ? AND date = ? AND time = ? AND status = 'upcoming'",
      [userId, slot.date, slot.time]
    );
    if (conflict) {
      await db.execAsync("ROLLBACK");
      transactionStarted = false;
      return res.status(409).json({ error: "У вас уже есть запись на это время" });
    }

    const bookingResult = await db.runAsync(
      "UPDATE slots SET is_booked = 1 WHERE id = ? AND is_booked = 0",
      [slot_id]
    );
    if (bookingResult.changes === 0) {
      await db.execAsync("ROLLBACK");
      transactionStarted = false;
      return res.status(409).json({ error: "Это время уже занято" });
    }

    const result = await db.runAsync(
      "INSERT INTO appointments (user_id, doctor_id, slot_id, date, time) VALUES (?, ?, ?, ?, ?)",
      [userId, doctor_id, slot_id, slot.date, slot.time]
    );

    await db.execAsync("COMMIT");
    transactionStarted = false;

    const appointment = await db.getAsync(
      `SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = ?`,
      [result.lastID]
    );

    return res.status(201).json({ appointment });
  } catch (error) {
    if (transactionStarted) {
      await db.execAsync("ROLLBACK").catch(() => {});
    }

    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Это время уже занято" });
    }

    throw error;
  }
}));

router.get("/my", asyncHandler(async (req, res) => {
  await syncCompletedAppointments();

  const appointments = await db.allAsync(
    `SELECT a.*, d.name as doctor_name, d.specialty as doctor_specialty, d.photo as doctor_photo, d.price as doctor_price
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     WHERE a.user_id = ?
     ORDER BY
       CASE a.status
         WHEN 'upcoming' THEN 0
         WHEN 'completed' THEN 1
         ELSE 2
       END,
       a.date ASC,
       a.time ASC`,
    [req.userId]
  );

  res.json({ appointments });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await syncCompletedAppointments();

  const appointment = await db.getAsync(
    "SELECT * FROM appointments WHERE id = ? AND user_id = ?",
    [req.params.id, req.userId]
  );
  if (!appointment) {
    return res.status(404).json({ error: "Запись не найдена" });
  }

  if (appointment.status !== "upcoming") {
    return res.status(400).json({ error: "Можно отменить только предстоящие записи" });
  }

  await db.execAsync("BEGIN IMMEDIATE TRANSACTION");
  try {
    await db.runAsync("UPDATE slots SET is_booked = 0 WHERE id = ?", [appointment.slot_id]);
    await db.runAsync("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [appointment.id]);
    await db.execAsync("COMMIT");
  } catch (error) {
    await db.execAsync("ROLLBACK").catch(() => {});
    throw error;
  }

  res.json({ message: "Запись отменена" });
}));

module.exports = router;
