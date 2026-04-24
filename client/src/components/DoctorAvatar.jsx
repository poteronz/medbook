import { useState } from "react";
import { getSpecialtyColors } from "../constants/specialties";

function doctorInitials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const SIZE_MAP = {
  sm:  { box: "h-11 w-11",  text: "text-sm",  radius: "rounded-[18px]" },
  md:  { box: "h-16 w-16",  text: "text-xl",  radius: "rounded-[22px]" },
  lg:  { box: "h-24 w-24",  text: "text-3xl", radius: "rounded-[28px]" },
  xl:  { box: "h-32 w-32",  text: "text-4xl", radius: "rounded-[32px]" },
};

export default function DoctorAvatar({ name, photo, specialty, size = "md", className = "" }) {
  const [photoError, setPhotoError] = useState(false);
  const s = SIZE_MAP[size] ?? SIZE_MAP.md;
  const colors = getSpecialtyColors(specialty || "");
  const letters = doctorInitials(name);

  if (photo && !photoError) {
    return (
      <img
        src={`/avatars/${photo}`}
        alt={name}
        className={`${s.box} ${s.radius} flex-shrink-0 object-cover border border-primary-100 shadow-inner ${className}`}
        onError={() => setPhotoError(true)}
      />
    );
  }

  return (
    <div
      className={`${s.box} ${s.radius} flex flex-shrink-0 items-center justify-center font-extrabold select-none ${className}`}
      style={{ background: colors.bg, color: colors.text }}
    >
      <span className={s.text}>{letters}</span>
    </div>
  );
}
