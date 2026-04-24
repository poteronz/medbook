import { Link } from "react-router-dom";
import { startTransition, useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import {
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import DoctorCard from "../components/DoctorCard";
import SectionHeading from "../components/SectionHeading";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  FAQ_ITEMS,
  HERO_BADGES,
  PATIENT_JOURNEY,
  SPECIALTY_SPOTLIGHTS,
  SYMPTOM_GUIDES,
} from "../constants/homeContent";
import { getSpecialtyColors } from "../constants/specialties";
import { formatAvailability, formatMoney } from "../utils/doctorFormatters";

const SORT_OPTIONS = [
  { value: "rating", label: "По рейтингу" },
  { value: "price_asc", label: "Сначала дешевле" },
  { value: "price_desc", label: "Сначала дороже" },
  { value: "experience", label: "По стажу" },
];

const TRUST_METRICS = [
  { icon: CalendarDaysIcon, value: "10 000+", label: "записей в месяц" },
  { icon: ShieldCheckIcon, value: "100%", label: "защищённая запись и авторизация" },
  { icon: StarIcon, value: "4.8", label: "средняя оценка сервиса" },
  { icon: ClockIcon, value: "< 5 мин", label: "на первую запись" },
];

export default function Home() {
  const { user } = useAuth();
  const catalogRef = useRef(null);

  useEffect(() => {
    document.title = "MedBook — Запись к врачу онлайн";
  }, []);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [sort, setSort] = useState("rating");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    api
      .get("/doctors/specialties")
      .then(({ data }) => {
        startTransition(() => setSpecialties(data.specialties));
      })
      .catch(() => setSpecialties([]));
  }, []);

  const fetchDoctors = useCallback(async (searchValue, specialtyValue, sortValue) => {
    setLoading(true);
    setError("");

    try {
      const params = { sort: sortValue };
      if (searchValue) {
        params.search = searchValue;
      }
      if (specialtyValue) {
        params.specialty = specialtyValue;
      }

      const { data } = await api.get("/doctors", { params });
      startTransition(() => setDoctors(data.doctors));
    } catch {
      setDoctors([]);
      setError("Не удалось загрузить список врачей. Проверьте, что сервер запущен и база заполнена.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchDoctors(deferredSearch, selectedSpecialty, sort);
    }, 250);

    return () => clearTimeout(timerId);
  }, [deferredSearch, selectedSpecialty, sort, fetchDoctors]);

  const topDoctor = doctors[0];
  const nextDoctor = doctors.find((doctor) => doctor.next_available_date && doctor.next_available_time);
  const averagePrice = doctors.length
    ? Math.round(doctors.reduce((sum, doctor) => sum + Number(doctor.price || 0), 0) / doctors.length)
    : 0;

  const jumpToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applySpecialty = (specialty) => {
    setSelectedSpecialty(specialty);
    jumpToCatalog();
  };

  return (
    <main className="pb-6">
      <section className="relative overflow-hidden border-b border-white/40 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_28%),linear-gradient(135deg,_#0f766e_0%,_#0a8c7d_42%,_#1c9f92_100%)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="pointer-events-none absolute -left-24 top-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-8 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-sm">
                <SparklesIcon className="h-4 w-4 text-emerald-200" />
                Онлайн-запись без звонков и долгого поиска
              </div>

              <h1 className="mt-6 text-4xl font-extrabold leading-[1.04] tracking-tight md:text-6xl">
                Подберите врача и запишитесь
                <span className="font-display mt-2 block text-emerald-50/95">понятно, спокойно и в удобное время</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/84">
                На одной странице видно специальность, опыт, формат приёма, цену и ближайшие свободные слоты. Можно быстро
                понять, к кому идти, и сразу перейти к записи.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {HERO_BADGES.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/92 backdrop-blur-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-8 rounded-[30px] border border-white/15 bg-white/10 p-4 shadow-[0_24px_70px_rgba(3,17,18,0.18)] backdrop-blur-md">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Например: терапевт, мигрень, давление, кожа..."
                      className="w-full rounded-2xl border border-white/15 bg-white/12 py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/45 outline-none transition focus:border-white/35 focus:bg-white/18"
                    />
                  </div>

                  <button
                    onClick={() => {
                      fetchDoctors(search, selectedSpecialty, sort);
                      jumpToCatalog();
                    }}
                    className="rounded-2xl bg-white px-5 py-4 text-sm font-extrabold text-primary-700 shadow-lg transition hover:bg-emerald-50"
                  >
                    Найти специалиста
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/78">
                  {specialties.slice(0, 6).map((specialty) => (
                    <button
                      key={specialty}
                      onClick={() => applySpecialty(specialty)}
                      className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 transition hover:bg-white/[0.16]"
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => scrollToSection("specialty-start")}
                  className="rounded-full border border-white/[0.18] bg-white/[0.10] px-4 py-2 text-sm font-semibold text-white/[0.92] transition hover:bg-white/[0.16]"
                >
                  По специальности
                </button>
                <button
                  onClick={() => scrollToSection("symptom-guides")}
                  className="rounded-full border border-white/[0.18] bg-white/[0.10] px-4 py-2 text-sm font-semibold text-white/[0.92] transition hover:bg-white/[0.16]"
                >
                  По симптомам
                </button>
                <button
                  onClick={jumpToCatalog}
                  className="rounded-full border border-white/[0.18] bg-white/[0.10] px-4 py-2 text-sm font-semibold text-white/[0.92] transition hover:bg-white/[0.16]"
                >
                  Ближайшие слоты
                </button>
                {user && (
                  <Link
                    to="/cabinet"
                    className="rounded-full border border-white/[0.18] bg-white/[0.10] px-4 py-2 text-sm font-semibold text-white/[0.92] transition hover:bg-white/[0.16]"
                  >
                    Мои записи
                  </Link>
                )}
              </div>
            </div>

            <aside className="grid gap-4">
              <div className="soft-card bg-white/96">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="section-kicker">Сегодня в каталоге</p>
                    <h2 className="mt-2 text-2xl font-extrabold text-slate-950">{doctors.length || 8} активных профилей</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Сравнивайте стоимость, опыт, формат приёма и ближайшие свободные даты без долгого поиска по разным экранам.
                    </p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary-50 text-primary-700">
                    <CheckBadgeIcon className="h-8 w-8" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Средняя стоимость</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-950">{formatMoney(averagePrice || 2600)} ₽</p>
                    <p className="mt-1 text-sm text-slate-500">по текущему каталогу врачей</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Топ по рейтингу</p>
                    <p className="mt-2 text-lg font-extrabold text-slate-950">{topDoctor?.name || "Анна Новикова"}</p>
                    <p className="mt-1 text-sm text-slate-500">{topDoctor?.headline || "Профиль с самой высокой оценкой"}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {TRUST_METRICS.map((metric) => (
                  <div key={metric.label} className="soft-card bg-white/90">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                        <metric.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-extrabold tracking-tight text-slate-950">{metric.value}</p>
                        <p className="text-sm text-slate-500">{metric.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="soft-card surface-dark">
                <p className="section-kicker--inverse">Ближайшее свободное время</p>
                <p className="mt-3 text-xl font-extrabold text-white">{nextDoctor?.name || "Сергей Морозов"}</p>
                <p className="mt-2 text-sm leading-6 surface-dark-muted">
                  {formatAvailability(nextDoctor?.next_available_date, nextDoctor?.next_available_time)}
                </p>
                <p className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 surface-dark-muted">
                  Если это время не подходит, откройте каталог и выберите другого специалиста или соседнюю дату.
                </p>
                <button onClick={jumpToCatalog} className="btn-light mt-4">
                  Смотреть каталог
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section-shell" id="quick-start">
        <SectionHeading
          eyebrow="Быстрый старт"
          title="Начните с понятного маршрута"
          description="Если не хочется листать весь каталог сразу, выберите сценарий, который ближе к вашему запросу."
        />

        <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <div className="soft-card surface-dark">
            <p className="section-kicker--inverse">Не знаете, с чего начать</p>
            <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Начните с терапевта</h3>
            <p className="mt-4 text-sm leading-7 surface-dark-muted">
              Подойдёт, если запрос пока широкий: слабость, температура, непонятные симптомы, результаты анализов или затяжное восстановление.
            </p>

            <div className="mt-6 grid gap-3">
              {[
                "Поможет собрать полную картину симптомов",
                "Подскажет, какие данные важны на приёме",
                "При необходимости направит к профильному врачу",
              ].map((item) => (
                <div key={item} className="surface-dark-panel px-4 py-3 text-sm surface-dark-muted">
                  {item}
                </div>
              ))}
            </div>

            <button onClick={() => applySpecialty("Терапевт")} className="btn-light mt-6">
              Открыть терапевтов
            </button>
          </div>

          <div className="soft-card bg-[radial-gradient(circle_at_top_left,_rgba(10,140,125,0.10),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#f8fcfb_100%)]">
            <p className="section-kicker">Нужно быстрее</p>
            <h3 className="mt-3 text-2xl font-extrabold text-slate-950">Покажем ближайшие слоты</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Каталог можно отсортировать по рейтингу, стоимости или опыту и сразу посмотреть, у кого есть ближайшее окно.
            </p>

            <div className="mt-6 rounded-[24px] border border-slate-100 bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ближайший доступный врач</p>
              <p className="mt-2 text-lg font-extrabold text-slate-950">{nextDoctor?.name || "Подберём удобное время"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {formatAvailability(nextDoctor?.next_available_date, nextDoctor?.next_available_time)}
              </p>
            </div>

            <button onClick={jumpToCatalog} className="btn-primary mt-6 text-sm">
              Смотреть врачей
            </button>
          </div>

          <div className="soft-card bg-white">
            <p className="section-kicker">После записи</p>
            <h3 className="mt-3 text-2xl font-extrabold text-slate-950">Всё останется под рукой</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Детали визита не потеряются: дата, время, статус записи и напоминания доступны в кабинете пациента.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Записи видны в личном кабинете",
                "Напоминания помогают не пропустить приём",
                "Можно быстро вернуться к нужному врачу",
              ].map((item) => (
                <div key={item} className="rounded-[20px] border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                  {item}
                </div>
              ))}
            </div>

            {user ? (
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/cabinet" className="btn-primary text-sm">
                  Открыть кабинет
                </Link>
                <Link
                  to="/reminders"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-primary-200 hover:text-primary-700"
                >
                  Напоминания
                </Link>
              </div>
            ) : (
              <button onClick={jumpToCatalog} className="btn-primary mt-6 text-sm">
                Перейти к врачам
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="section-shell pt-0" id="specialty-start">
        <SectionHeading
          eyebrow="Направления"
          title="Выберите специальность, если уже понимаете запрос"
          description="Эти сценарии помогают быстро сузить поиск и перейти к нужным специалистам без лишнего чтения."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SPECIALTY_SPOTLIGHTS.map((item) => {
            const colors = getSpecialtyColors(item.specialty);

            return (
              <button key={item.specialty} onClick={() => applySpecialty(item.specialty)} className="group text-left">
                <article className="soft-card h-full transition duration-300 hover:border-primary-200 hover:shadow-[0_20px_60px_rgba(10,140,125,0.12)]">
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em]"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {item.specialty}
                  </span>
                  <h3 className="mt-4 text-xl font-extrabold leading-tight text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  <span className="mt-6 inline-flex text-sm font-bold text-primary-700 transition group-hover:translate-x-1">
                    Перейти к врачам →
                  </span>
                </article>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-shell pt-0" id="symptom-guides">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <div>
            <SectionHeading
              eyebrow="Навигатор по симптомам"
              title="Приходите не только по специальности, но и по реальному запросу"
              description="Если вы отталкиваетесь от жалобы, начните с коротких сценариев ниже и сразу перейдите к подходящему направлению."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {SYMPTOM_GUIDES.map((item) => (
                <button key={item.title} onClick={() => applySpecialty(item.specialty)} className="text-left">
                  <article className="soft-card h-full transition duration-300 hover:border-primary-200">
                    <p className="text-lg font-extrabold text-slate-950">{item.title}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                    <div className="mt-5 inline-flex rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700">
                      Подойдёт: {item.specialty}
                    </div>
                  </article>
                </button>
              ))}
            </div>
          </div>

          <aside className="soft-card bg-[radial-gradient(circle_at_top_left,_rgba(10,140,125,0.10),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#f8fcfb_100%)]">
            <p className="section-kicker">Что важно перед записью</p>
            <h3 className="mt-3 text-2xl font-extrabold text-slate-950">Сверьте три вещи</h3>
            <div className="mt-6 space-y-3">
              {[
                "Подходит ли врач по профилю запроса",
                "Удобны ли дата, формат и стоимость приёма",
                "Нужны ли записи и напоминания после бронирования",
              ].map((item, index) => (
                <div key={item} className="flex gap-3 rounded-[22px] border border-slate-100 bg-white/90 px-4 py-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-sm font-extrabold text-primary-700">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>

            <button onClick={jumpToCatalog} className="btn-primary mt-6 text-sm">
              Перейти к каталогу
            </button>
          </aside>
        </div>
      </section>

      <section ref={catalogRef} id="doctor-catalog" className="section-shell pt-0">
        <SectionHeading
          eyebrow="Каталог врачей"
          title="Сравните специалистов по опыту, стоимости и ближайшей доступной дате"
          description="Фильтры помогают быстро сузить поиск, а карточки сразу показывают, чего ожидать от консультации."
          action={
            !loading && !error ? (
              <div className="metric-card min-w-[220px]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Результаты</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950">{doctors.length}</p>
                <p className="mt-1 text-sm text-slate-500">врачей в текущей выборке</p>
              </div>
            ) : null
          }
        />

        <div className="mt-8 rounded-[30px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <div className="grid gap-3 xl:grid-cols-[minmax(220px,240px)_minmax(200px,220px)_minmax(0,1fr)] xl:items-center">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedSpecialty}
                onChange={(event) => setSelectedSpecialty(event.target.value)}
                className="input-field appearance-none pl-9"
              >
                <option value="">Все специальности</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <AdjustmentsHorizontalIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="input-field appearance-none pl-9">
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              {selectedSpecialty && (
                <button onClick={() => setSelectedSpecialty("")} className="tag-chip border-primary-100 bg-primary-50 text-primary-700">
                  {selectedSpecialty} ×
                </button>
              )}
              {search && (
                <button onClick={() => setSearch("")} className="tag-chip border-slate-200 bg-slate-50 text-slate-700">
                  Поиск: {search} ×
                </button>
              )}
            </div>
          </div>
        </div>

        {!loading && !error && doctors.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="metric-card">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Лучший рейтинг</p>
              <p className="mt-2 text-lg font-extrabold text-slate-950">{topDoctor?.name}</p>
              <p className="mt-1 text-sm text-slate-500">{topDoctor?.rating?.toFixed?.(1) || Number(topDoctor?.rating || 0).toFixed(1)} из 5</p>
            </div>
            <div className="metric-card">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Средняя стоимость</p>
              <p className="mt-2 text-lg font-extrabold text-slate-950">{formatMoney(averagePrice)} ₽</p>
              <p className="mt-1 text-sm text-slate-500">по активной выборке</p>
            </div>
            <div className="metric-card">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ближайшее окно</p>
              <p className="mt-2 text-lg font-extrabold text-slate-950">{nextDoctor?.name || "Подберём вручную"}</p>
              <p className="mt-1 text-sm text-slate-500">{formatAvailability(nextDoctor?.next_available_date, nextDoctor?.next_available_time)}</p>
            </div>
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-6">
                  <div className="h-8 w-24 rounded-full bg-slate-100" />
                  <div className="mt-5 h-8 w-2/3 rounded-xl bg-slate-100" />
                  <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />
                  <div className="mt-6 h-32 rounded-[22px] bg-slate-100" />
                  <div className="mt-6 h-12 rounded-2xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="soft-card text-center">
              <p className="text-lg font-semibold text-red-600">{error}</p>
              <button onClick={() => fetchDoctors(search, selectedSpecialty, sort)} className="btn-primary mt-4 text-sm">
                Повторить загрузку
              </button>
            </div>
          ) : doctors.length === 0 ? (
            <div className="soft-card text-center">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-xl font-extrabold text-slate-950">Ничего не найдено</p>
              <p className="mt-2 text-sm text-slate-500">Попробуйте сбросить фильтры или изменить поисковый запрос.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {doctors.map((doctor, index) => (
                <DoctorCard key={doctor.id} doctor={doctor} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section-shell pt-0" id="care-path">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="soft-card bg-[radial-gradient(circle_at_top_left,_rgba(10,140,125,0.08),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#f8fcfb_100%)]">
            <SectionHeading
              eyebrow="После записи"
              title="Что будет дальше"
              description="Путь от выбора врача до визита остаётся коротким и понятным даже после бронирования."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {PATIENT_JOURNEY.map((item) => (
                <article key={item.step} className="rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-sm">
                  <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-extrabold tracking-[0.2em] text-primary-700">
                    {item.step}
                  </span>
                  <h3 className="mt-5 text-xl font-extrabold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="soft-card">
              <SectionHeading
                eyebrow="FAQ"
                title="Короткие ответы на частые вопросы"
                description="Самое важное о выборе врача, записи и напоминаниях без длинных инструкций."
              />

              <div className="mt-8 space-y-4">
                {FAQ_ITEMS.map((item) => (
                  <article key={item.question} className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-5">
                    <h3 className="text-lg font-extrabold text-slate-950">{item.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="soft-card surface-dark">
              <p className="section-kicker--inverse">Нужна помощь с выбором</p>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Начните с самого простого шага</h3>
              <p className="mt-4 text-sm leading-7 surface-dark-muted">
                Если сомневаетесь, откройте терапевтов или сразу перейдите в каталог. После записи все детали визита останутся в кабинете.
              </p>

              <div className="mt-6 grid gap-3">
                {[
                  "Специальность, стоимость и ближайшая дата видны сразу",
                  "После бронирования запись попадает в кабинет пациента",
                  "Напоминания помогают не забыть о визите",
                ].map((item) => (
                  <div key={item} className="surface-dark-panel px-4 py-3 text-sm surface-dark-muted">
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => applySpecialty("Терапевт")} className="btn-light">
                  Открыть терапевтов
                </button>
                {user ? (
                  <Link
                    to="/cabinet"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/[0.14] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                  >
                    Мои записи
                  </Link>
                ) : (
                  <button
                    onClick={jumpToCatalog}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/[0.14] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                  >
                    Перейти к врачам
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
