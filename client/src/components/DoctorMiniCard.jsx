import { Link } from "react-router-dom";
import { CalendarDaysIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { getSpecialtyColors } from "../constants/specialties";
import { formatAvailability } from "../utils/doctorFormatters";
import DoctorAvatar from "./DoctorAvatar";

export default function DoctorMiniCard({ doctor }) {
  const colors = getSpecialtyColors(doctor.specialty);

  return (
    <article className="soft-card h-full">
      <div className="flex items-center gap-3">
        <DoctorAvatar name={doctor.name} photo={doctor.photo} specialty={doctor.specialty} size="sm" />
        <div className="min-w-0">
          <span
            className="inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em]"
            style={{ background: colors.bg, color: colors.text }}
          >
            {doctor.specialty}
          </span>
          <h3 className="mt-2 text-lg font-extrabold text-slate-950 leading-tight">{doctor.name}</h3>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{doctor.headline || doctor.bio}</p>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <CalendarDaysIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" />
        <div>
          <p className="font-semibold text-slate-900">Ближайшее окно</p>
          <p className="mt-1">{formatAvailability(doctor.next_available_date, doctor.next_available_time)}</p>
        </div>
      </div>

      <Link
        to={`/doctor/${doctor.id}`}
        className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-700 transition hover:text-primary-800"
      >
        Открыть профиль
        <ArrowUpRightIcon className="h-4 w-4" />
      </Link>
    </article>
  );
}
