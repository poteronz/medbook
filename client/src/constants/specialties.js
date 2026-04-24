export const SPECIALTY_COLORS = {
  Терапевт: { bg: "#e0f5f2", text: "#076457" },
  Кардиолог: { bg: "#fee2e2", text: "#991b1b" },
  Дерматолог: { bg: "#fef3c7", text: "#92400e" },
  Невролог: { bg: "#ede9fe", text: "#5b21b6" },
  Офтальмолог: { bg: "#dbeafe", text: "#1e40af" },
  Хирург: { bg: "#fce7f3", text: "#9d174d" },
  Эндокринолог: { bg: "#d1fae5", text: "#065f46" },
};

export function getSpecialtyColors(specialty) {
  return SPECIALTY_COLORS[specialty] || { bg: "#f3f4f6", text: "#374151" };
}
