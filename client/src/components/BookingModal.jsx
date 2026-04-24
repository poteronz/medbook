import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function BookingModal({ doctor, slot, onBooked, onClose, onAuthRequired }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const formatFullDate = (dateStr) =>
    new Date(`${dateStr}T00:00:00`).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const confirmBooking = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/appointments", {
        doctor_id: doctor.id,
        slot_id: slot.id,
      });

      onBooked?.(data.appointment);
      setSuccess(true);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Не удалось оформить запись");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content text-center" onClick={(event) => event.stopPropagation()}>
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-9 h-9 text-primary-600" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Запись подтверждена</h2>
          <p className="text-gray-500 text-sm mb-1">{doctor.name}</p>
          <p className="text-primary-600 font-semibold text-sm mb-6">
            {formatFullDate(slot.date)}, {slot.time}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Закрыть
            </button>
            <button
              onClick={() => {
                navigate("/cabinet");
                onClose();
              }}
              className="flex-1 btn-primary py-2.5 text-sm"
            >
              Мои записи
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-gray-900">Подтвердить запись</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 mb-5">
          {[
            { Icon: UserIcon, label: "Врач", value: doctor.name, sub: doctor.specialty },
            { Icon: CalendarDaysIcon, label: "Дата", value: formatFullDate(slot.date) },
            { Icon: ClockIcon, label: "Время", value: slot.time },
          ].map(({ Icon, label, value, sub }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-bold text-gray-800">{value}</p>
                {sub && <p className="text-xs text-primary-600">{sub}</p>}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between p-3 bg-primary-50 rounded-xl border border-primary-100">
            <span className="text-sm text-gray-600">Стоимость приёма</span>
            <span className="text-lg font-extrabold text-primary-700">
              {Number(doctor.price || 0).toLocaleString("ru-RU")} ₽
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}
        {!user && (
          <div className="mb-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            Для записи необходимо войти в аккаунт
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={confirmBooking}
            disabled={loading}
            className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? "Сохраняем..." : user ? "Подтвердить" : "Войти и записаться"}
          </button>
        </div>
      </div>
    </div>
  );
}
