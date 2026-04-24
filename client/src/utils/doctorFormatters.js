export function formatMoney(value) {
  return Number(value || 0).toLocaleString("ru-RU");
}

export function formatDoctorDateLabel(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.round((date - today) / 86400000);
  if (diff === 0) {
    return "Сегодня";
  }
  if (diff === 1) {
    return "Завтра";
  }

  return date.toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatFullDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

export function formatAvailability(date, time) {
  if (!date || !time) {
    return "Подберём время после консультации";
  }

  return `${formatDoctorDateLabel(date)}, ${time}`;
}

export function getReviewLabel(count) {
  const safeCount = Number(count) || 0;
  const mod10 = safeCount % 10;
  const mod100 = safeCount % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "отзыв";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "отзыва";
  }
  return "отзывов";
}

export function initials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}
