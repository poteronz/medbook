const bcrypt = require("bcryptjs");
const db = require("./index");
const { demoUser, doctors, reviewTexts, slotTimes } = require("./demoData");

function toSqlDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function serializeArray(value) {
  return JSON.stringify(value ?? []);
}

async function clearDemoTables() {
  await db.runAsync("DELETE FROM appointments");
  await db.runAsync("DELETE FROM reviews");
  await db.runAsync("DELETE FROM slots");
  await db.runAsync("DELETE FROM doctors");
  await db.runAsync("DELETE FROM users");
  await db.runAsync(
    "DELETE FROM sqlite_sequence WHERE name IN ('appointments', 'reviews', 'slots', 'doctors', 'users')"
  );
}

async function ensureDemoUser() {
  const existing = await db.getAsync("SELECT id FROM users WHERE email = ?", [demoUser.email]);
  if (existing) {
    return existing.id;
  }

  const passwordHash = await bcrypt.hash(demoUser.password, 10);
  const result = await db.runAsync(
    "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
    [demoUser.name, demoUser.email, passwordHash, demoUser.phone]
  );
  return result.lastID;
}

async function insertDoctors() {
  const doctorIds = [];

  for (const doctor of doctors) {
    const result = await db.runAsync(
      `INSERT INTO doctors (
        name, specialty, headline, rating, experience, price, bio, education,
        clinic_name, clinic_address, work_format, schedule_summary, appointment_duration,
        focus_areas, services, approach, languages, achievements, education_points, reception_modes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctor.name,
        doctor.specialty,
        doctor.headline,
        doctor.rating,
        doctor.experience,
        doctor.price,
        doctor.bio,
        doctor.education,
        doctor.clinic_name,
        doctor.clinic_address,
        doctor.work_format,
        doctor.schedule_summary,
        doctor.appointment_duration,
        serializeArray(doctor.focus_areas),
        serializeArray(doctor.services),
        serializeArray(doctor.approach),
        serializeArray(doctor.languages),
        serializeArray(doctor.achievements),
        serializeArray(doctor.education_points),
        serializeArray(doctor.reception_modes),
      ]
    );
    doctorIds.push(result.lastID);
  }

  return doctorIds;
}

async function insertSlots(doctorIds) {
  const today = new Date();

  for (const doctorId of doctorIds) {
    for (let offset = 1; offset <= 18; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      if (date.getDay() === 0) {
        continue;
      }

      const dateStr = toSqlDate(date);
      for (const time of slotTimes) {
        const minutes = Number.parseInt(time.slice(3, 5), 10);
        const hours = Number.parseInt(time.slice(0, 2), 10);
        const shouldInsert = (doctorId + offset + hours + minutes) % 5 !== 0;

        if (!shouldInsert) {
          continue;
        }

        await db.runAsync(
          "INSERT OR IGNORE INTO slots (doctor_id, date, time) VALUES (?, ?, ?)",
          [doctorId, dateStr, time]
        );
      }
    }
  }
}

async function insertReviews(doctorIds, userId) {
  for (const doctorId of doctorIds) {
    const reviewsToCreate = (doctorId % 4) + 2;

    for (let index = 0; index < reviewsToCreate; index += 1) {
      const rating = index === 0 ? 5 : index === 1 ? 5 : 4;
      const text = reviewTexts[(doctorId + index) % reviewTexts.length];

      await db.runAsync(
        "INSERT INTO reviews (doctor_id, user_id, rating, text) VALUES (?, ?, ?, ?)",
        [doctorId, userId, rating, text]
      );
    }
  }
}

async function seedDemoData({ reset = false } = {}) {
  if (reset) {
    await clearDemoTables();
  } else {
    const doctorCount = await db.getAsync("SELECT COUNT(*) AS count FROM doctors");
    if (doctorCount?.count > 0) {
      return { seeded: false, reason: "already-populated" };
    }

    await db.runAsync("DELETE FROM appointments");
    await db.runAsync("DELETE FROM reviews");
    await db.runAsync("DELETE FROM slots");
    await db.runAsync("DELETE FROM doctors");
  }

  const demoUserId = await ensureDemoUser();
  const doctorIds = await insertDoctors();
  await insertSlots(doctorIds);
  await insertReviews(doctorIds, demoUserId);

  return { seeded: true, doctors: doctorIds.length };
}

module.exports = { seedDemoData };
