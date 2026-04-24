import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRightIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import DoctorAvatar from "../components/DoctorAvatar";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUS = {
  upcoming: { label: "Предстоит", cls: "badge--upcoming" },
  completed: { label: "Завершён", cls: "badge--completed" },
  cancelled: { label: "Отменён", cls: "badge--cancelled" },
};

const TABS = [
  { key: "upcoming", label: "Предстоящие" },
  { key: "completed", label: "Завершённые" },
  { key: "cancelled", label: "Отменённые" },
];

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateStr, time) {
  return `${formatDate(dateStr)} в ${time}`;
}

function compareAppointments(a, b) {
  return new Date(`${a.date}T${a.time}:00`) - new Date(`${b.date}T${b.time}:00`);
}

export default function Cabinet() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    document.title = "Личный кабинет | MedBook";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }

    api
      .get("/appointments/my")
      .then(({ data }) => {
        setAppointments(data.appointments);
        setError("");
      })
      .catch(() => setError("Не удалось загрузить список записей"))
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = async (appointmentId) => {
    setCancelLoading(true);
    setError("");

    try {
      await api.delete(`/appointments/${appointmentId}`);
      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status: "cancelled" } : appointment
        )
      );
      setCancelId(null);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Не удалось отменить запись");
    } finally {
      setCancelLoading(false);
    }
  };

  const filteredAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === tab),
    [appointments, tab]
  );

  const counts = Object.fromEntries(
    TABS.map((currentTab) => [
      currentTab.key,
      appointments.filter((appointment) => appointment.status === currentTab.key).length,
    ])
  );

  const nextAppointment = useMemo(() => {
    const next = appointments.filter((appointment) => appointment.status === "upcoming").sort(compareAppointments);
    return next[0] ?? null;
  }, [appointments]);

  if (authLoading || !user) {
    if (!authLoading && !user) return null;
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-5">
          <div className="h-48 rounded-[32px] bg-slate-100" />
          <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="h-48 rounded-[28px] bg-slate-100" />
            <div className="h-96 rounded-[28px] bg-slate-100" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(10,140,125,0.14),_transparent_26%),linear-gradient(180deg,_#ffffff_0%,_#f7fbfa_100%)] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <div>
            <p className="section-kicker">Личный кабинет</p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
              Ваши записи и детали визитов
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
              Здесь видно, что запланировано, что уже завершилось и какие записи были отменены. Всё важное по приёму остаётся в одном месте.
            </p>

            {user && (
              <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-extrabold text-primary-700">
                  {user.name?.trim()?.charAt(0).toUpperCase() || "?"}
                </div>
                <span>
                  {user.name} · {user.email}
                </span>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Предстоящие</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950">{counts.upcoming || 0}</p>
                <p className="mt-1 text-sm text-slate-500">активных записей</p>
              </div>
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Завершённые</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950">{counts.completed || 0}</p>
                <p className="mt-1 text-sm text-slate-500">прошедших визитов</p>
              </div>
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Отменённые</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950">{counts.cancelled || 0}</p>
                <p className="mt-1 text-sm text-slate-500">записей в архиве</p>
              </div>
            </div>
          </div>

          <aside className="soft-card surface-dark">
            <p className="section-kicker--inverse">Ближайший визит</p>
            {nextAppointment ? (
              <>
                <h2 className="mt-4 text-2xl font-extrabold text-white">{nextAppointment.doctor_name}</h2>
                <p className="mt-2 text-sm font-semibold text-emerald-100">{nextAppointment.doctor_specialty}</p>
                <div className="mt-5 space-y-3">
                  <div className="surface-dark-panel px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Дата и время</p>
                    <p className="mt-2 text-sm leading-6 text-slate-100">{formatDateTime(nextAppointment.date, nextAppointment.time)}</p>
                  </div>
                  <div className="surface-dark-panel px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Стоимость</p>
                    <p className="mt-2 text-lg font-extrabold text-white">
                      {Number(nextAppointment.doctor_price || 0).toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link to="/reminders" className="btn-light">
                    Открыть напоминания
                  </Link>
                  {nextAppointment.doctor_id && (
                    <Link
                      to={`/doctor/${nextAppointment.doctor_id}`}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/[0.14] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                    >
                      Профиль врача
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-2xl font-extrabold text-white">Пока нет будущих записей</h2>
                <p className="mt-3 text-sm leading-7 surface-dark-muted">
                  Выберите врача в каталоге, чтобы запланировать визит. После записи он сразу появится здесь.
                </p>
                <Link to="/" className="btn-light mt-6">
                  Найти врача
                </Link>
              </>
            )}
          </aside>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="soft-card">
            <div className="flex items-start gap-3">
              <BellAlertIcon className="mt-1 h-6 w-6 flex-shrink-0 text-primary-600" />
              <div>
                <p className="text-lg font-extrabold text-slate-950">Что можно сделать здесь</p>
                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <p>Смотреть будущие визиты и быстро переходить к профилю врача.</p>
                  <p>Отменять запись, если планы изменились.</p>
                  <p>Открывать напоминания, чтобы не забыть о ближайшем приёме.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="info-alert info-alert--accent">
            <p className="text-sm font-extrabold text-slate-950">Подсказка</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Если запись больше не нужна, отмените её заранее. Слот сразу вернётся в расписание и снова станет доступен.
            </p>
          </div>

          {error && (
            <div className="info-alert info-alert--danger">
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
          )}
        </aside>

        <section>
          <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
            {TABS.map((currentTab) => (
              <button
                key={currentTab.key}
                onClick={() => setTab(currentTab.key)}
                className={`flex-1 rounded-xl px-3 py-3 text-sm font-bold transition-all ${
                  tab === currentTab.key
                    ? "bg-white text-primary-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {currentTab.label}
                {counts[currentTab.key] > 0 && (
                  <span
                    className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                      tab === currentTab.key
                        ? "bg-primary-100 text-primary-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {counts[currentTab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div key={tab} className="mt-5 animate-tab-slide">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="soft-card animate-pulse">
                    <div className="h-6 w-40 rounded bg-slate-100" />
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="h-20 rounded-2xl bg-slate-100" />
                      <div className="h-20 rounded-2xl bg-slate-100" />
                      <div className="h-20 rounded-2xl bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="soft-card text-center">
                <CalendarDaysIcon className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-xl font-extrabold text-slate-950">В этом разделе пока пусто</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {tab === "upcoming"
                    ? "Когда вы запишетесь к врачу, будущий визит появится здесь."
                    : tab === "completed"
                      ? "Здесь будут храниться завершённые визиты."
                      : "Отменённые записи останутся здесь для истории."}
                </p>
                {tab === "upcoming" && (
                  <Link to="/" className="btn-primary mt-5 text-sm">
                    Найти врача
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => {
                  const status = STATUS[appointment.status] || STATUS.upcoming;

                  return (
                    <article key={appointment.id} className="soft-card animate-fade-up">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <DoctorAvatar name={appointment.doctor_name} specialty={appointment.doctor_specialty} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xl font-extrabold text-slate-950">{appointment.doctor_name}</p>
                            <p className="mt-1 text-sm font-semibold text-primary-700">{appointment.doctor_specialty}</p>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                              {appointment.status === "upcoming"
                                ? "Визит запланирован и ждёт подтверждения в день приёма."
                                : appointment.status === "completed"
                                  ? "Приём уже состоялся и сохранён в истории."
                                  : "Запись отменена и слот освобождён."}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`badge ${status.cls}`}>{status.label}</span>
                          {appointment.doctor_id && (
                            <Link
                              to={`/doctor/${appointment.doctor_id}`}
                              className="inline-flex items-center gap-1 text-sm font-bold text-primary-700 transition hover:text-primary-800"
                            >
                              Профиль врача
                              <ArrowUpRightIcon className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 md:grid-cols-3">
                        <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            <CalendarDaysIcon className="h-4 w-4" />
                            Дата
                          </div>
                          <p className="mt-3 text-sm font-bold text-slate-950">{formatDate(appointment.date)}</p>
                        </div>
                        <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            <ClockIcon className="h-4 w-4" />
                            Время
                          </div>
                          <p className="mt-3 text-sm font-bold text-slate-950">{appointment.time}</p>
                        </div>
                        <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            <MapPinIcon className="h-4 w-4" />
                            Стоимость
                          </div>
                          <p className="mt-3 text-sm font-bold text-slate-950">
                            {Number(appointment.doctor_price || 0).toLocaleString("ru-RU")} ₽
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <p className="text-sm text-slate-500">{formatDateTime(appointment.date, appointment.time)}</p>

                        {appointment.status === "upcoming" && (
                          <button
                            onClick={() => setCancelId(appointment.id)}
                            className="inline-flex items-center gap-1 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Отменить запись
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {cancelId && (
        <div className="modal-overlay" onClick={() => setCancelId(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <h3 className="mb-2 text-base font-extrabold text-slate-900">Отменить запись?</h3>
            <p className="mb-5 text-sm leading-6 text-slate-500">
              Слот освободится и снова станет доступен другим пациентам. Если ещё сомневаетесь, запись можно оставить.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Оставить
              </button>
              <button
                onClick={() => handleCancel(cancelId)}
                disabled={cancelLoading}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {cancelLoading ? "Отменяем..." : "Отменить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
