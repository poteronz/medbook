const express = require("express");
const db = require("../db");
const asyncHandler = require("../utils/asyncHandler");
const { serializeDoctor, serializeDoctors } = require("../utils/doctorSerializer");

const router = express.Router();

const LIST_SELECT = `
  SELECT
    d.*,
    (
      SELECT COUNT(*)
      FROM reviews r
      WHERE r.doctor_id = d.id
    ) AS reviews_count,
    (
      SELECT COUNT(*)
      FROM slots s
      WHERE s.doctor_id = d.id
        AND s.is_booked = 0
        AND datetime(s.date || ' ' || s.time) > datetime('now', 'localtime')
    ) AS available_slots_count,
    (
      SELECT s.date
      FROM slots s
      WHERE s.doctor_id = d.id
        AND s.is_booked = 0
        AND datetime(s.date || ' ' || s.time) > datetime('now', 'localtime')
      ORDER BY s.date ASC, s.time ASC
      LIMIT 1
    ) AS next_available_date,
    (
      SELECT s.time
      FROM slots s
      WHERE s.doctor_id = d.id
        AND s.is_booked = 0
        AND datetime(s.date || ' ' || s.time) > datetime('now', 'localtime')
      ORDER BY s.date ASC, s.time ASC
      LIMIT 1
    ) AS next_available_time
  FROM doctors d
`;

router.get("/", asyncHandler(async (req, res) => {
  const { specialty, search, sort } = req.query;
  let query = `${LIST_SELECT} WHERE 1=1`;
  const params = [];

  if (specialty) {
    query += " AND d.specialty = ?";
    params.push(String(specialty).trim());
  }

  if (search) {
    const searchValue = `%${String(search).trim()}%`;
    query += `
      AND (
        d.name LIKE ? COLLATE NOCASE OR
        d.specialty LIKE ? COLLATE NOCASE OR
        d.headline LIKE ? COLLATE NOCASE OR
        d.clinic_name LIKE ? COLLATE NOCASE
      )
    `;
    params.push(searchValue, searchValue, searchValue, searchValue);
  }

  switch (sort) {
    case "price_asc":
      query += " ORDER BY d.price ASC, d.rating DESC";
      break;
    case "price_desc":
      query += " ORDER BY d.price DESC, d.rating DESC";
      break;
    case "experience":
      query += " ORDER BY d.experience DESC, d.rating DESC";
      break;
    default:
      query += " ORDER BY d.rating DESC, d.experience DESC";
  }

  query += " LIMIT 100";

  const doctors = await db.allAsync(query, params);
  res.json({ doctors: serializeDoctors(doctors) });
}));

router.get("/specialties", asyncHandler(async (req, res) => {
  const rows = await db.allAsync("SELECT DISTINCT specialty FROM doctors ORDER BY specialty");
  res.json({ specialties: rows.map((row) => row.specialty) });
}));

router.get("/:id/dates", asyncHandler(async (req, res) => {
  const dates = await db.allAsync(
    `SELECT DISTINCT date
     FROM slots
     WHERE doctor_id = ?
       AND is_booked = 0
       AND datetime(date || ' ' || time) > datetime('now', 'localtime')
     ORDER BY date ASC`,
    [req.params.id]
  );

  res.json({ dates: dates.map((item) => item.date) });
}));

router.get("/:id/slots", asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    return res.status(400).json({ error: "Параметр date обязателен и должен быть в формате YYYY-MM-DD" });
  }

  const slots = await db.allAsync(
    `SELECT id, date, time, is_booked
     FROM slots
     WHERE doctor_id = ?
       AND date = ?
       AND datetime(date || ' ' || time) > datetime('now', 'localtime')
     ORDER BY time ASC`,
    [req.params.id, date]
  );

  res.json({ slots });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const doctor = await db.getAsync(
    `${LIST_SELECT}
     WHERE d.id = ?`,
    [req.params.id]
  );

  if (!doctor) {
    return res.status(404).json({ error: "Врач не найден" });
  }

  const reviews = await db.allAsync(
    `SELECT r.*, u.name as user_name
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.doctor_id = ?
     ORDER BY r.created_at DESC`,
    [req.params.id]
  );

  res.json({
    doctor: serializeDoctor(doctor),
    reviews,
  });
}));

module.exports = router;
