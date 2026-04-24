const db = require("../db");

async function syncCompletedAppointments() {
  await db.runAsync(
    `UPDATE appointments
     SET status = 'completed'
     WHERE status = 'upcoming'
       AND datetime(date || ' ' || time) <= datetime('now', 'localtime')`
  );
}

module.exports = { syncCompletedAppointments };
