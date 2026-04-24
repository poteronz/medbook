import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ClockIcon,
  GlobeAltIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import api from "../api/client";
import BookingModal from "../components/BookingModal";
import AuthModal from "../components/AuthModal";
import DoctorAvatar from "../components/DoctorAvatar";
import DoctorMiniCard from "../components/DoctorMiniCard";
import SectionHeading from "../components/SectionHeading";
import { getSpecialtyColors } from "../constants/specialties";
import {
  formatAvailability,
  formatDoctorDateLabel,
  formatMoney,
  formatShortDate,
  getReviewLabel,
  initials,
  safeArray,
} from "../utils/doctorFormatters";

export default function DoctorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedDoctors, setRelatedDoctors] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [bookingModal, setBookingModal] = useState(false);
  const [authModal, setAuthModal] = useState(null);

  useEffect(() => {
    const loadDoctorPage = async () => {
      setPageLoading(true);
      setPageError("");

      try {
        const [doctorResponse, datesResponse] = await Promise.all([
          api.get(`/doctors/${id}`),
          api.get(`/doctors/${id}/dates`),
        ]);

        const nextDates = datesResponse.data.dates;
        const loadedDoctor = doctorResponse.data.doctor;
        document.title = `${loadedDoctor.name} — ${loadedDoctor.specialty} | MedBook`;
        setDoctor(loadedDoctor);
        setReviews(doctorResponse.data.reviews);
        setAvailableDates(nextDates);
        setSelectedDate(nextDates[0] ?? null);
      } catch (error) {
        if (error.response?.status === 404) {
          setPageError("Такой врач не найден.");
        } else {
          setPageError("Не удалось загрузить страницу врача.");
        }
      } finally {
        setPageLoading(false);
      }
    };

    loadDoctorPage();
  }, [id]);

  useEffect(() => {
    if (!doctor?.specialty) {
      setRelatedDoctors([]);
      return;
    }

    api
      .get("/doctors", { params: { specialty: doctor.specialty, sort: "rating" } })
      .then(({ data }) => {
        setRelatedDoctors(data.doctors.filter((item) => item.id !== doctor.id).slice(0, 3));
      })
      .catch(() => setRelatedDoctors([]));
  }, [doctor?.id, doctor?.specialty]);

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }

    setSlotsLoading(true);
    setSelectedSlot(null);

    api
      .get(`/doctors/${id}/slots`, { params: { date: selectedDate } })
      .then(({ data }) => setSlots(data.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, id]);

  const reviewCount = reviews.length || doctor?.reviews_count || 0;
  const averageRating = useMemo(() => {
    if (!doctor) {
      return "0.0";
    }

    if (reviews.length === 0) {
      return Number(doctor.rating || 0).toFixed(1);
    }

    return (
      reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    ).toFixed(1);
  }, [doctor, reviews]);

  const specialtyColors = doctor ? getSpecialtyColors(doctor.specialty) : getSpecialtyColors("");

  const focusAreas = safeArray(doctor?.focus_areas);
  const services = safeArray(doctor?.services);
  const approach = safeArray(doctor?.approach);
  const achievements = safeArray(doctor?.achievements);
  const educationPoints = safeArray(doctor?.education_points);
  const languages = safeArray(doctor?.languages);
  const receptionModes = safeArray(doctor?.reception_modes);

  const consultationStages = doctor
    ? [
        {
          title: "Подготовка к приёму",
          description: "Перед визитом можно собрать жалобы, анализы и вопросы — врач сразу увидит полную картину.",
        },
        {
          title: `Консультация ${doctor.appointment_duration || 45} минут`,
          description: doctor.work_format || "Во время приёма врач разберёт симптомы, задаст уточняющие вопросы и объяснит следующий шаг.",
        },
        {
          title: "План действий после визита",
          description: "После консультации пациент понимает, что делать дальше: наблюдаться, сдавать анализы или записываться на контроль.",
        },
      ]
    : [];

  const visitChecklist = receptionModes.includes("Онлайн")
    ? [
        {
          title: "Подготовьте документы",
          description: "Если есть результаты анализов, выписки или список лекарств, держите их под рукой до начала консультации.",
        },
        {
          title: "Запишите симптомы и вопросы",
          description: "Короткая заметка поможет ничего не забыть и быстрее перейти к сути на приёме.",
        },
        {
          title: "Проверьте связь заранее",
          description: "Для онлайн-визита лучше заранее проверить интернет, звук и тихое место, где удобно разговаривать с врачом.",
        },
      ]
    : [
        {
          title: "Возьмите важные документы",
          description: "Если есть анализы, выписки или список лекарств, лучше принести их с собой на консультацию.",
        },
        {
          title: "Подготовьте краткую историю симптомов",
          description: "Когда всё началось, что усиливает дискомфорт и какие вопросы хочется обсудить с врачом.",
        },
        {
          title: "Приходите немного заранее",
          description: "Небольшой запас по времени поможет спокойно оформить визит и начать приём без спешки.",
        },
      ];

  const handleBooked = (appointment) => {
    setSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.id === appointment.slot_id ? { ...slot, is_booked: 1 } : slot
      )
    );
    setSelectedSlot(null);
  };

  if (pageLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-5 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/5" />
        <div className="h-72 bg-slate-100 rounded-[28px]" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[600px] bg-slate-100 rounded-[28px]" />
          <div className="h-[420px] bg-slate-100 rounded-[28px]" />
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-700 mb-5 transition-colors font-medium"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Назад
        </button>
        <div className="soft-card text-center">
          <p className="text-lg font-semibold text-slate-900">{pageError}</p>
          <button onClick={() => navigate("/")} className="btn-primary mt-4 text-sm">
            Вернуться к каталогу
          </button>
        </div>
      </main>
    );
  }

  if (!doctor) {
    return null;
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 font-medium transition-colors hover:text-primary-700"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Назад к врачам
          </button>
          <span className="text-slate-300">/</span>
          <Link to="/" className="transition-colors hover:text-primary-700">Каталог</Link>
          <span className="text-slate-300">/</span>
          <span>{doctor.specialty}</span>
        </div>

        <section className="mt-5 overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(10,140,125,0.14),_transparent_26%),linear-gradient(180deg,_#ffffff_0%,_#f7fbfa_100%)] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] md:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
            <div>
              <div className="flex flex-wrap items-start gap-5">
                <DoctorAvatar name={doctor.name} photo={doctor.photo} specialty={doctor.specialty} size="lg" />
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em]"
                    style={{ background: specialtyColors.bg, color: specialtyColors.text }}
                  >
                    {doctor.specialty}
                  </span>
                  <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-slate-950">
                    {doctor.name}
                  </h1>
                  <p className="mt-3 max-w-3xl text-base md:text-lg leading-8 text-slate-600">
                    {doctor.headline || doctor.bio}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
                      <StarIcon className="h-5 w-5 text-amber-400" />
                      {averageRating} · {reviewCount} {getReviewLabel(reviewCount)}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      <ClockIcon className="h-5 w-5 text-slate-400" />
                      Стаж {doctor.experience} лет
                    </div>
                    {receptionModes.map((mode) => (
                      <span key={mode} className="inline-flex rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700">
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="metric-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Клиника</p>
                  <p className="mt-2 text-lg font-extrabold text-slate-950">{doctor.clinic_name}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{doctor.clinic_address}</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Формат</p>
                  <p className="mt-2 text-lg font-extrabold text-slate-950">{doctor.work_format}</p>
                  <p className="mt-1 text-sm text-slate-500">{doctor.schedule_summary}</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ближайшее окно</p>
                  <p className="mt-2 text-lg font-extrabold text-slate-950">
                    {formatAvailability(doctor.next_available_date, doctor.next_available_time)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Свободных слотов: {doctor.available_slots_count || 0}
                  </p>
                </div>
              </div>
            </div>

            <aside className="soft-card surface-dark">
              <p className="section-kicker--inverse">Коротко о приёме</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Стоимость</p>
                  <p className="mt-2 text-3xl font-extrabold text-white">{formatMoney(doctor.price)} ₽</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Длительность</p>
                  <p className="mt-2 text-lg font-bold text-white">{doctor.appointment_duration || 45} минут</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Расписание</p>
                  <p className="mt-2 text-sm leading-7 surface-dark-muted">{doctor.schedule_summary}</p>
                </div>
                <div className="surface-dark-panel p-4 text-sm leading-7 surface-dark-muted">
                  После записи дата, время и детали визита появятся в кабинете пациента, а напоминание поможет не пропустить приём.
                </div>
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="order-2 space-y-6 xl:order-1">
            <section className="soft-card">
              <SectionHeading
                eyebrow="О враче"
                title="Чем специалист может быть полезен именно на практике"
                description={doctor.bio}
              />

              {focusAreas.length > 0 && (
                <div className="mt-7">
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-400">Ключевые фокусы</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {focusAreas.map((item) => (
                      <span key={item} className="tag-chip">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {approach.length > 0 && (
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {approach.map((item) => (
                    <article key={item} className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-5">
                      <SparklesIcon className="h-6 w-6 text-primary-600" />
                      <p className="mt-4 text-sm leading-7 text-slate-600">{item}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="soft-card">
              <SectionHeading
                eyebrow="Сценарии консультации"
                title="Как проходит приём и с чем врач помогает"
                description="Ниже собрана практическая информация: какие запросы берёт врач, как обычно проходит консультация и чего ожидать после визита."
              />

              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-6">
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-400">С чем помогает</p>
                  <div className="mt-4 space-y-3">
                    {services.map((item) => (
                      <div key={item} className="rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-6">
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-400">Как проходит визит</p>
                  <div className="mt-4 space-y-4">
                    {consultationStages.map((item, index) => (
                      <div key={item.title} className="flex gap-4 rounded-2xl border border-white/80 bg-white p-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-sm font-extrabold text-primary-700">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-950">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="soft-card">
              <SectionHeading
                eyebrow="Образование и доверие"
                title="Почему этому врачу легко доверить важный запрос"
                description="В этом блоке собраны академическая база, профессиональные акценты и детали формата консультации."
              />

              <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-6">
                  <div className="flex items-start gap-3">
                    <AcademicCapIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary-600" />
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-400">Базовое образование</p>
                      <p className="mt-3 text-lg font-extrabold text-slate-950">{doctor.education}</p>
                      {educationPoints.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {educationPoints.map((item) => (
                            <p key={item} className="rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                              {item}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-6">
                    <div className="flex items-start gap-3">
                      <ShieldCheckIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary-600" />
                      <div>
                        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-400">Достижения и практика</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {achievements.map((item) => (
                            <span key={item} className="tag-chip">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <GlobeAltIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary-600" />
                        <div>
                          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-400">Языки</p>
                          <p className="mt-3 text-sm leading-7 text-slate-600">{languages.join(", ") || "Русский"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarDaysIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary-600" />
                        <div>
                          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-400">Формат приёма</p>
                          <p className="mt-3 text-sm leading-7 text-slate-600">{doctor.work_format}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {reviews.length > 0 && (
              <section className="soft-card">
                <SectionHeading
                  eyebrow="Отзывы"
                  title="Что пациенты говорят после консультации"
                  description="Секция отзывов помогает увидеть не только оценку, но и стиль коммуникации врача."
                />

                <div className="mt-8 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Общий рейтинг</p>
                    <p className="mt-3 text-5xl font-extrabold tracking-tight text-slate-950">{averageRating}</p>
                    <div className="mt-4 flex gap-1">
                      {[1, 2, 3, 4, 5].map((index) => (
                        <StarIcon
                          key={index}
                          className={`h-5 w-5 ${
                            index <= Math.round(Number(averageRating)) ? "text-amber-400" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {reviewCount} {getReviewLabel(reviewCount)} · пациенты чаще всего отмечают ясность объяснений и спокойную коммуникацию.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {reviews.map((review) => {
                      const reviewerName = review.user_name || "Пациент";

                      return (
                        <article key={review.id} className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-sm font-extrabold text-primary-700">
                                {initials(reviewerName)}
                              </div>
                              <div>
                                <p className="text-sm font-extrabold text-slate-950">{reviewerName}</p>
                                <p className="text-xs text-slate-400">
                                  {new Date(review.created_at).toLocaleDateString("ru-RU")}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((index) => (
                                <StarIcon
                                  key={index}
                                  className={`h-4 w-4 ${index <= review.rating ? "text-amber-400" : "text-slate-200"}`}
                                />
                              ))}
                            </div>
                          </div>

                          {review.text && <p className="mt-4 text-sm leading-7 text-slate-600">{review.text}</p>}
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {relatedDoctors.length > 0 && (
              <section className="soft-card">
                <SectionHeading
                  eyebrow="Похожие специалисты"
                  title={`Если хотите сравнить ещё ${doctor.specialty.toLowerCase()}ов`}
                  description="Иногда пользователю важно не просто записаться, а сравнить несколько сильных профилей в одном направлении."
                />

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {relatedDoctors.map((item) => (
                    <DoctorMiniCard key={item.id} doctor={item} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="order-1 space-y-5 xl:order-2 xl:sticky xl:top-24 xl:self-start">
            <section className="soft-card">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                  <CalendarDaysIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="section-kicker">Онлайн-запись</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Выберите дату и время</h2>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ближайшее окно</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-950">
                      {formatAvailability(doctor.next_available_date, doctor.next_available_time)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Свободно</p>
                    <p className="mt-1 text-lg font-extrabold text-primary-700">{doctor.available_slots_count || 0}</p>
                  </div>
                </div>
              </div>

              {availableDates.length === 0 ? (
                <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm text-slate-500">
                  Сейчас нет свободных дат. Можно выбрать похожего специалиста ниже или вернуться в каталог.
                </div>
              ) : (
                <>
                  <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                    {availableDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`flex-shrink-0 rounded-2xl border px-4 py-2 text-sm font-bold transition-all ${
                          selectedDate === date
                            ? "border-primary-600 bg-primary-600 text-white shadow-lg"
                            : "border-slate-200 bg-white text-slate-600 hover:border-primary-300"
                        }`}
                      >
                        {formatDoctorDateLabel(date)}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5">
                    {slotsLoading ? (
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 9 }).map((_, index) => (
                          <div key={index} className="h-10 rounded-2xl bg-slate-100 animate-pulse" />
                        ))}
                      </div>
                    ) : slots.filter((slot) => !slot.is_booked).length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm text-slate-500">
                        На выбранную дату свободных слотов нет. Попробуйте соседний день.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot.id}
                            disabled={Boolean(slot.is_booked)}
                            onClick={() => !slot.is_booked && setSelectedSlot(slot)}
                            className={`slot-btn ${
                              slot.is_booked
                                ? "slot-btn--booked"
                                : selectedSlot?.id === slot.id
                                  ? "slot-btn--selected"
                                  : ""
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSlot && (
                    <button onClick={() => setBookingModal(true)} className="btn-primary mt-5 w-full py-3 text-sm">
                      Записаться — {selectedSlot.time}, {formatShortDate(selectedSlot.date)}
                    </button>
                  )}
                </>
              )}
            </section>

            <section className="soft-card">
              <div className="flex items-start gap-3">
                <MapPinIcon className="mt-1 h-6 w-6 flex-shrink-0 text-primary-600" />
                <div>
                  <p className="section-kicker">Клиника и формат</p>
                  <h3 className="mt-1 text-xl font-extrabold text-slate-950">{doctor.clinic_name}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{doctor.clinic_address}</p>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{doctor.work_format}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Языки консультации</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{languages.join(", ") || "Русский"}</p>
              </div>
            </section>

            <section className="soft-card surface-dark">
              <p className="section-kicker--inverse">Перед визитом</p>
              <div className="mt-4 space-y-3">
                {visitChecklist.map((item, index) => (
                  <div key={item.title} className="surface-dark-panel p-4">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-extrabold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white">{item.title}</p>
                        <p className="mt-2 text-sm leading-7 surface-dark-muted">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>

      {bookingModal && selectedSlot && (
        <BookingModal
          doctor={doctor}
          slot={selectedSlot}
          onBooked={handleBooked}
          onClose={() => setBookingModal(false)}
          onAuthRequired={() => {
            setBookingModal(false);
            setAuthModal("login");
          }}
        />
      )}
      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSwitch={setAuthModal} />}
    </>
  );
}
