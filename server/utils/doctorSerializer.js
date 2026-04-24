const JSON_FIELDS = [
  "focus_areas",
  "services",
  "approach",
  "languages",
  "achievements",
  "education_points",
  "reception_modes",
];

function parseJsonArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeDoctor(doctor) {
  if (!doctor) {
    return doctor;
  }

  const serialized = { ...doctor };

  JSON_FIELDS.forEach((field) => {
    serialized[field] = parseJsonArray(serialized[field]);
  });

  return serialized;
}

function serializeDoctors(doctors) {
  return doctors.map(serializeDoctor);
}

module.exports = {
  serializeDoctor,
  serializeDoctors,
};
