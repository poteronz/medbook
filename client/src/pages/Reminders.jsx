import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BellIcon,
  CalendarDaysIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import DoctorAvatar from "../components/DoctorAvatar";
import { BellAlertIcon } from "@heroicons/react/24/solid";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function getNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

function Countdown({ date, time }) {
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    const updateCountdown = () => {
      const target = new Date(`${date}T${time}:00`);
      const milliseconds = target - new Date();

      if (milliseconds <= 0) {
        setDiff(null);
        return;
      }

      setDiff({
        h: Math.floor(milliseconds / 3600000),
        m: Math.floor((milliseconds % 3600000) / 60000),
        s: Math.floor((milliseconds % 60000) / 1000),
      });
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [date, time]);

  if (!diff) {
    return <span className="text-xs text-slate-400">Время приёма уже прошло</span>;
  }

  const urgent = diff.h < 1;
  const soon = diff.h < 24;

  return (
    <span
      className={`font-mono text-sm font-bold tabular-nums ${
        urgent ? "text-red-500" : soon ? "text-amber-500" : "text-primary-600"
      }`}
    >
      {diff.h > 0 ? `${diff.h}ч ` : ""}
      {diff.m}м {diff.s}с
    </span>
  );
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function Reminders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission);
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    document.title = "Напоминания о приёмах | MedBook";
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
      .get("/reminders")
      .then(({ data }) => {
        setReminders(data.reminders);
        setError("");
      })
      .catch(() => setError("Не удалось загрузить напоминания"))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const { data } = await api.get("/reminders");
        setReminders(data.reminders);

        if (notificationPermission === "granted" && "Notification" in window) {
          for (const reminder of data.reminders) {
            if (reminder.countdown.is_urgent && !notifiedRef.current.has(reminder.id)) {
              notifiedRef.current.add(reminder.id);
              new Notification("Напоминание о приёме", {
                body: `${reminder.doctor_name} · ${reminder.time} сегодня`,
                icon: "/favicon.ico",
              });
            }
          }
        }
      } catch {
        // Тихо пропускаем минутный опрос, чтобы не засорять интерфейс ошибками.
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [notificationPermission, user]);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const nextReminder = useMemo(() => reminders[0] ?? null, [reminders]);
  const urgentCount = reminders.filter((reminder) => reminder.countdown.is_urgent).length;
  const soonCount = reminders.filter((reminder) => reminder.countdown.is_soon).length;

  if (authLoading || !user) {
    if (!authLoading && !user) return null;
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-5">
          <div className="h-48 rounded-[32px] bg-slate-100" />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="h-80 rounded-[28px] bg-slate-100" />
            <div className="h-56 rounded-[28px] bg-slate-100" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(10,140,125,0.14),_transparent_26%),linear-gradient(180deg,_#ffffff_0%,_#f7fbfa_100%)] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_360px]">
          <div>
            <p className="section-kicker">Напоминания</p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
              Следите за ближайшими приёмами
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
              Здесь видно, сколько времени осталось до визита, какие записи особенно близко и когда стоит подготовить документы заранее.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Всего напоминаний</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950">{reminders.length}</p>
                <p className="mt-1 text-sm text-slate-500">будущих приёмов</p>
              </div>
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Скоро</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950">{soonCount}</p>
                <p className="mt-1 text-sm text-slate-500">в ближайшие 24 часа</p>
              </div>
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Срочно</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-950">{urgentCount}</p>
                <p className="mt-1 text-sm text-slate-500">меньше часа до приёма</p>
              </div>
            </div>
          </div>

          <aside className="soft-card surface-dark">
            <p className="section-kicker--inverse">Следующий визит</p>
            {nextReminder ? (
              <>
                <h2 className="mt-4 text-2xl font-extrabold text-white">{nextReminder.doctor_name}</h2>
                <p className="mt-2 text-sm font-semibold text-emerald-100">{nextReminder.doctor_specialty}</p>
                <div className="mt-5 space-y-3">
                  <div className="surface-dark-panel px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Дата</p>
                    <p className="mt-2 text-sm capitalize text-slate-100">{formatDate(nextReminder.date)}</p>
                  </div>
                  <div className="surface-dark-panel px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">До приёма</p>
                    <div className="mt-2">
                      <Countdown date={nextReminder.date} time={nextReminder.time} />
                    </div>
                  </div>
                </div>
                <Link to="/cabinet" className="btn-light mt-5">
                  Открыть кабинет
                </Link>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-2xl font-extrabold text-white">Пока нет будущих визитов</h2>
                <p className="mt-3 text-sm leading-7 surface-dark-muted">
                  После записи ближайший приём появится здесь, а таймер поможет не пропустить удобное время.
                </p>
                <Link to="/" className="btn-light mt-6">
                  Найти врача
                </Link>
              </>
            )}
          </aside>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          {notificationPermission === "default" && (
            <div className="info-alert info-alert--accent">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-slate-950">Включите системные уведомления</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Браузер сможет напомнить о приёме, когда до визита останется совсем немного времени.
                  </p>
                </div>
                <button onClick={requestPermission} className="btn-primary text-sm">
                  Разрешить уведомления
                </button>
              </div>
            </div>
          )}

          {notificationPermission === "granted" && (
            <div className="info-alert info-alert--success">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-extrabold text-slate-950">Уведомления включены</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Если приём станет срочным по времени, браузер подскажет об этом отдельно.
                  </p>
                </div>
              </div>
            </div>
          )}

          {notificationPermission === "denied" && (
            <div className="info-alert info-alert--warning">
              <div className="flex items-start gap-3">
                <BellIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-extrabold text-slate-950">Браузерные уведомления отключены</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Таймеры и статусы на странице продолжат работать, но системные уведомления нужно включить в настройках браузера.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="info-alert info-alert--danger">
              <p className="text-sm font-semibold text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((index) => (
                <div key={index} className="soft-card animate-pulse">
                  <div className="h-6 w-48 rounded bg-slate-100" />
                  <div className="mt-5 h-20 rounded-[24px] bg-slate-100" />
                </div>
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="soft-card text-center">
              <BellIcon className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-xl font-extrabold text-slate-950">Пока нет предстоящих приёмов</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Запишитесь к врачу, и здесь сразу появятся напоминания с таймером до визита.
              </p>
              <Link to="/" className="btn-primary mt-5 text-sm">
                Записаться к врачу
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => {
                const { is_urgent: isUrgent, is_soon: isSoon } = reminder.countdown;

                return (
                  <article
                    key={reminder.id}
                    className={`soft-card animate-fade-up reminder-card ${
                      isUrgent ? "reminder-card--urgent" : isSoon ? "reminder-card--soon" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <DoctorAvatar name={reminder.doctor_name} specialty={reminder.doctor_specialty} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xl font-extrabold text-slate-950">{reminder.doctor_name}</p>
                          <p className="mt-1 text-sm font-semibold text-primary-700">{reminder.doctor_specialty}</p>
                          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-2">
                              <CalendarDaysIcon className="h-4 w-4" />
                              <span className="capitalize">{formatDate(reminder.date)}</span>
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <ClockIcon className="h-4 w-4" />
                              {reminder.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 px-4 py-3 text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">До приёма</p>
                        <div className="mt-2">
                          <Countdown date={reminder.date} time={reminder.time} />
                        </div>
                      </div>
                    </div>

                    {isUrgent && (
                      <div className="mt-4 rounded-[20px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        Приём меньше чем через час. Подготовьте документы, результаты анализов и всё, что хотите обсудить с врачом.
                      </div>
                    )}

                    {!isUrgent && isSoon && (
                      <div className="mt-4 rounded-[20px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                        Визит уже близко: приём состоится в ближайшие 24 часа.
                      </div>
                    )}

                    {reminder.doctor_id && (
                      <div className="mt-4 flex justify-end">
                        <Link
                          to={`/doctor/${reminder.doctor_id}`}
                          className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 transition hover:text-primary-800"
                        >
                          Открыть врача
                          <BellAlertIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="soft-card">
            <p className="text-lg font-extrabold text-slate-950">Как это работает</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Таймер показывает, сколько осталось до визита прямо сейчас.</p>
              <p>Срочные приёмы выделяются сильнее, чтобы их было проще заметить.</p>
              <p>Все будущие записи всегда можно открыть из кабинета пациента.</p>
            </div>
          </div>

          <div className="soft-card surface-dark">
            <p className="section-kicker--inverse">Быстрый переход</p>
            <h3 className="mt-3 text-2xl font-extrabold text-white">Нужны все детали визита?</h3>
            <p className="mt-3 text-sm leading-7 surface-dark-muted">
              В кабинете можно посмотреть статус записи, вернуться к профилю врача и при необходимости отменить визит.
            </p>
            <Link to="/cabinet" className="btn-light mt-6">
              Открыть кабинет
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
