import { ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";

const FOOTER_SECTIONS = [
  {
    title: "Запись",
    items: ["Подбор врача по симптому или специальности", "Свободные слоты без звонков", "Понятная стоимость и формат приёма"],
  },
  {
    title: "Кабинет",
    items: ["Все будущие визиты в одном месте", "Быстрый переход к профилю врача", "Отмена записи и история статусов"],
  },
  {
    title: "Напоминания",
    items: ["Обновление ближайших приёмов", "Уведомления перед визитом", "Подсказки, что подготовить заранее"],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden border-t border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(10,140,125,0.12),_transparent_30%),linear-gradient(180deg,_#ffffff_0%,_#f4faf9_100%)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/70 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm">
              <ShieldCheckIcon className="h-4 w-4" />
              Защищённая запись и история визитов под рукой
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-slate-950">MedBook</p>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                Сервис онлайн-записи, в котором удобно выбрать врача, быстро занять слот и не потерять детали визита после бронирования.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <SparklesIcon className="h-4 w-4 text-primary-500" />
                Онлайн-запись 24/7
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5">
                Кабинет пациента и напоминания
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className="soft-card p-5">
                <p className="text-sm font-extrabold text-slate-900">{section.title}</p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {section.items.map((item) => (
                    <p key={item} className="leading-6">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-200/80 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 MedBook · Онлайн-запись к врачу</span>
          <span>Понятные профили врачей, свободные слоты и напоминания о визите</span>
        </div>
      </div>
    </footer>
  );
}
