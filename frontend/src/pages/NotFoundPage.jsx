import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <p className="mb-2 text-4xl font-semibold text-slate-300">404</p>
      <p className="mb-6 text-slate-400">Страница не найдена</p>
      <Link
        to="/"
        className="rounded bg-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-500"
      >
        На главную
      </Link>
    </div>
  );
}
