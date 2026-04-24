import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  HeartIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null);

  const navLinks = [
    { to: "/", label: "Врачи и направления" },
    ...(user
      ? [
          { to: "/cabinet", label: "Мои записи" },
          { to: "/reminders", label: "Напоминания" },
        ]
      : []),
  ];

  const isActive = (path) => location.pathname === path;
  const userInitial = user?.name?.trim()?.charAt(0).toUpperCase() || "?";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/78 backdrop-blur-xl supports-[backdrop-filter]:bg-white/72">
        <div className="border-b border-slate-100/80 bg-slate-950 text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs text-white/75 sm:px-6">
            <div className="inline-flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-300" />
              Защищённая запись, кабинет пациента и напоминания в одном месте
            </div>
            <span className="hidden sm:inline">Без звонков, бумажной путаницы и лишних шагов</span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-4">
            <Link to="/" className="group flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-primary-600 text-white shadow-lg shadow-primary-200/70 transition group-hover:bg-primary-700">
                <HeartIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-lg font-extrabold tracking-tight text-slate-950">
                  Med<span className="text-primary-600">Book</span>
                </span>
                <span className="block text-xs text-slate-400">Онлайн-запись к врачу</span>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 p-1 shadow-sm lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive(link.to)
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-primary-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              {user ? (
                <>
                  <Link
                    to="/reminders"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-primary-700"
                  >
                    <BellIcon className="h-5 w-5" />
                  </Link>
                  <Link
                    to="/cabinet"
                    className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-primary-200"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-sm font-extrabold text-primary-700">
                      {userInitial}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-extrabold text-slate-950">{user.name}</p>
                      <p className="text-xs text-slate-400">Личный кабинет</p>
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:text-red-500"
                    title="Выйти"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setAuthModal("login")}
                    className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:text-primary-700"
                  >
                    Войти
                  </button>
                  <button
                    onClick={() => setAuthModal("register")}
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-700"
                  >
                    Создать аккаунт
                  </button>
                </>
              )}
            </div>

            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 lg:hidden"
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="animate-fade-up border-t border-slate-100 bg-white lg:hidden">
            <div className="mx-auto max-w-7xl space-y-3 px-4 py-4 sm:px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-2xl px-4 py-3 text-sm font-semibold ${
                    isActive(link.to) ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-slate-100 pt-3">
                {user ? (
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-600"
                  >
                    Выйти ({user.name})
                  </button>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => {
                        setAuthModal("login");
                        setMenuOpen(false);
                      }}
                      className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700"
                    >
                      Войти
                    </button>
                    <button
                      onClick={() => {
                        setAuthModal("register");
                        setMenuOpen(false);
                      }}
                      className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
                    >
                      Создать аккаунт
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSwitch={setAuthModal} />}
    </>
  );
}
