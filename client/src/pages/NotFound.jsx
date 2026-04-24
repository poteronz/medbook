import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  useEffect(() => {
    document.title = "Страница не найдена | MedBook";
  }, []);
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-extrabold text-gray-100 mb-4 select-none">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Страница не найдена</h1>
        <p className="text-gray-500 mb-8">
          Возможно, она была удалена или вы перешли по неверной ссылке.
        </p>
        <Link to="/" className="btn-primary px-6 py-3 text-sm">
          ← На главную
        </Link>
      </div>
    </main>
  );
}
