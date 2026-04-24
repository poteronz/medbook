import { Link } from "react-router-dom";
import { CalendarDaysIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { getSpecialtyColors } from "../constants/specialties";
import { formatAvailability, formatMoney, getReviewLabel, safeArray } from "../utils/doctorFormatters";
import DoctorAvatar from "./DoctorAvatar";

function SpecialtyPill({ specialty }) {
  const colors = getSpecialtyColors(specialty);
  return (
    <span
      style={{ background: colors.bg, color: colors.text }}
      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em]"
    >
      {specialty}
    </span>
  );
}

function StarRating({ rating, reviewsCount }) {
  const safeRating = Number(rating) || 0;
  const filled = Math.round(safeRating);
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon key={i} className={`h-3.5 w-3.5 ${i <= filled ? "text-amber-400" : "text-slate-200"}`} />
        ))}
      </div>
      <span className="text-xs font-bold text-amber-900">{safeRating.toFixed(1)}</span>
      <span className="text-xs text-amber-700/80">{reviewsCount} {getReviewLabel(reviewsCount)}</span>
    </div>
  );
}

export default function DoctorCard({ doctor, index = 0 }) {
  const focusAreas = safeArray(doctor.focus_areas).slice(0, 3);
  const modes = safeArray(doctor.reception_modes).slice(0, 2);
  const colors = getSpecialtyColors(doctor.specialty);

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(15,23,42,0.13)] hover:border-slate-300 animate-fade-up"
      style={{
        animationDelay: `${index * 60}ms`,
        borderTop: `3px solid ${colors.text}`,
      }}
    >
      <div className="flex flex-col flex-1 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <DoctorAvatar name={doctor.name} photo={doctor.photo} specialty={doctor.specialty} size="md" />
          <div className="min-w-0 flex-1">
            <SpecialtyPill specialty={doctor.specialty} />
            <h3 className="mt-2.5 text-lg font-extrabold leading-snug text-slate-950">{doctor.name}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-500 line-clamp-2">{doctor.headline || doctor.bio}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StarRating rating={doctor.rating} reviewsCount={doctor.reviews_count || 0} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
            Стаж {doctor.experience} лет
          </span>
          {modes.map((mode) => (
            <span key={mode} className="inline-flex items-center rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1.5 text-xs font-semibold text-primary-700">
              {mode}
            </span>
          ))}
        </div>

        <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 text-sm">
          <div className="flex items-start gap-2.5">
            <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-800">{doctor.clinic_name || "MedBook Clinic"}</p>
              <p className="text-xs text-slate-500 mt-0.5">{doctor.clinic_address || "Адрес уточняется"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <CalendarDaysIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-800">Ближайшее окно</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatAvailability(doctor.next_available_date, doctor.next_available_time)}</p>
            </div>
          </div>
        </div>

        {focusAreas.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {focusAreas.map((item) => (
              <span key={item} className="tag-chip text-[11px]">{item}</span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Стоимость</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{formatMoney(doctor.price)} ₽</p>
            <p className="text-xs text-slate-400">за приём{doctor.appointment_duration ? ` · ${doctor.appointment_duration} мин` : ""}</p>
          </div>
          <Link
            to={`/doctor/${doctor.id}`}
            className="btn-primary text-sm w-full sm:w-auto"
          >
            Открыть профиль →
          </Link>
        </div>
      </div>
    </article>
  );
}
