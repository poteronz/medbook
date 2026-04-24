import { useState } from "react";
import { HeartIcon, EyeIcon, EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ mode, onClose, onSwitch }) {
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = mode === "login";

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.phone);
      }
      onClose();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.response?.data?.errors?.[0]?.msg ||
          "Не удалось выполнить авторизацию"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <HeartIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {isLogin ? "Вход в MedBook" : "Создать аккаунт"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Имя</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Иван Иванов"
                className="input-field"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="example@mail.ru"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Минимум 6 символов"
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                Телефон <span className="text-gray-300 normal-case">— необязательно</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+7 (999) 000-00-00"
                className="input-field"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm disabled:opacity-50 mt-1">
            {loading ? "Загрузка..." : isLogin ? "Войти" : "Создать аккаунт"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <button
            onClick={() => onSwitch(isLogin ? "register" : "login")}
            className="text-primary-600 font-bold hover:text-primary-700 transition-colors"
          >
            {isLogin ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>

        {isLogin && (
          <div className="mt-3 p-2.5 bg-gray-50 rounded-xl text-center text-xs text-gray-400 border border-gray-100">
            Демо-аккаунт: <span className="font-mono font-semibold text-gray-600">demo@medbook.ru</span> /{" "}
            <span className="font-mono font-semibold text-gray-600">demo1234</span>
          </div>
        )}
      </div>
    </div>
  );
}
