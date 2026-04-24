const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "medbook.db");
const db = new sqlite3.Database(dbPath);

function repairEncoding(value) {
  if (typeof value !== "string" || !/[\u00D0\u00D1\u00E2]/.test(value)) {
    return value;
  }

  try {
    const repaired = Buffer.from(value, "latin1").toString("utf8");
    return repaired.includes("\uFFFD") ? value : repaired;
  } catch {
    return value;
  }
}

function normalizeStrings(input) {
  if (Array.isArray(input)) {
    return input.map(normalizeStrings);
  }

  if (!input || typeof input !== "object") {
    return repairEncoding(input);
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, normalizeStrings(value)])
  );
}

function runSchemaStatement(sql) {
  db.run(sql, (error) => {
    if (!error) {
      return;
    }

    if (/duplicate column name|already exists/i.test(error.message)) {
      return;
    }

    console.error("Schema error:", error.message);
  });
}

db.serialize(() => {
  runSchemaStatement("PRAGMA journal_mode = WAL");
  runSchemaStatement("PRAGMA foreign_keys = ON");

  runSchemaStatement(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  runSchemaStatement(`CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    photo TEXT DEFAULT '/avatars/default.jpg',
    rating REAL DEFAULT 4.5,
    experience INTEGER DEFAULT 5,
    price INTEGER DEFAULT 2000,
    bio TEXT,
    education TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  [
    "headline TEXT",
    "clinic_name TEXT",
    "clinic_address TEXT",
    "work_format TEXT",
    "schedule_summary TEXT",
    "appointment_duration INTEGER DEFAULT 45",
    "focus_areas TEXT",
    "services TEXT",
    "approach TEXT",
    "languages TEXT",
    "achievements TEXT",
    "education_points TEXT",
    "reception_modes TEXT",
  ].forEach((columnDefinition) => {
    runSchemaStatement(`ALTER TABLE doctors ADD COLUMN ${columnDefinition}`);
  });

  runSchemaStatement(`CREATE TABLE IF NOT EXISTS slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    is_booked INTEGER DEFAULT 0,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    UNIQUE(doctor_id, date, time)
  )`);

  runSchemaStatement(`CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    slot_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'upcoming',
    reminder_sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE
  )`);

  runSchemaStatement(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  runSchemaStatement("CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_slot_id ON appointments(slot_id)");
  runSchemaStatement("CREATE INDEX IF NOT EXISTS idx_slots_doctor_datetime ON slots(doctor_id, date, time)");
  runSchemaStatement("CREATE INDEX IF NOT EXISTS idx_reviews_doctor_created_at ON reviews(doctor_id, created_at)");
  runSchemaStatement("CREATE INDEX IF NOT EXISTS idx_appointments_user_status_date ON appointments(user_id, status, date, time)");
});

db.getAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (error, row) => (error ? reject(error) : resolve(normalizeStrings(row))))
  );

db.allAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (error, rows) => (error ? reject(error) : resolve(normalizeStrings(rows))))
  );

db.runAsync = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ lastID: this.lastID, changes: this.changes });
    })
  );

db.execAsync = (sql) =>
  new Promise((resolve, reject) =>
    db.exec(sql, (error) => (error ? reject(error) : resolve()))
  );

module.exports = db;
